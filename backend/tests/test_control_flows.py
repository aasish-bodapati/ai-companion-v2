from fastapi.testclient import TestClient


def _create_conversation_via_api(client: TestClient, title: str = "Test") -> str:
    r = client.post(
        "/api/v1/conversations/", json={"title": title, "personalization_enabled": True}
    )
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def test_idempotency_send_message_returns_same_message_id(monkeypatch, client: TestClient):
    # Mock Redis for idempotency
    class FakeRedis:
        def __init__(self):
            self._data = {}

        async def hgetall(self, key):
            return self._data.get(key, {})

        async def hset(self, key, mapping):
            if key not in self._data:
                self._data[key] = {}
            self._data[key].update(mapping)
            return True

        async def expire(self, key, ttl):
            return True

    fake_instance = FakeRedis()

    async def fake_get_redis():
        return fake_instance

    from app.core import redis_client
    monkeypatch.setattr(redis_client, "get_redis", fake_get_redis, raising=False)
    
    # Also mock the global Redis variable
    monkeypatch.setattr(redis_client, "_redis", fake_instance, raising=False)

    conv_id = _create_conversation_via_api(client)

    headers = {"Idempotency-Key": "abc123"}
    payload = {"role": "user", "content": "Hello there"}

    r1 = client.post(f"/api/v1/conversations/{conv_id}/messages", json=payload, headers=headers)
    assert r1.status_code == 200
    msg1 = r1.json()
    assert msg1.get("id") is not None
    print(f"First message ID: {msg1.get('id')}")
    print(f"Redis data after first request: {fake_instance._data}")

    # Second send with same key should return same message
    r2 = client.post(f"/api/v1/conversations/{conv_id}/messages", json=payload, headers=headers)
    assert r2.status_code == 200
    msg2 = r2.json()
    print(f"Second message ID: {msg2.get('id')}")
    print(f"Redis data after second request: {fake_instance._data}")
    assert msg2.get("id") == msg1.get("id")


def test_rate_limit_redis_sliding_window_429(monkeypatch, client: TestClient):
    # Enable rate limiting with low threshold
    from app.core.config import settings

    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "RATE_LIMIT_SEND_PER_WINDOW", 3, raising=False)
    monkeypatch.setattr(settings, "RATE_LIMIT_WINDOW_SECONDS", 60, raising=False)
    monkeypatch.setattr(settings, "REDIS_URL", "redis://fake", raising=False)

    class FakePipe:
        def __init__(self, parent):
            self.parent = parent
            self.ops = []

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def zremrangebyscore(self, key, start, end):
            self.ops.append(("zremrangebyscore", key, start, end))
            return self

        def zadd(self, key, mapping):
            ts = list(mapping.values())[0]
            self.ops.append(("zadd", key, ts))
            return self

        def zcard(self, key):
            self.ops.append(("zcard", key))
            return self

        def expire(self, key, ttl):
            self.ops.append(("expire", key, ttl))
            return self

        async def execute(self):
            counts = 0
            for op in self.ops:
                if op[0] == "zremrangebyscore":
                    key, start, end = op[1], op[2], op[3]
                    self.parent._zset[key] = [
                        t for t in self.parent._zset.get(key, []) if not (start <= t <= end)
                    ]
                elif op[0] == "zadd":
                    key, ts = op[1], op[2]
                    self.parent._zset.setdefault(key, []).append(int(ts))
                elif op[0] == "zcard":
                    key = op[1]
                    counts = len(self.parent._zset.get(key, []))
                elif op[0] == "expire":
                    pass
            self.ops.clear()
            return [None, None, counts, True]

    class FakeRedis:
        def __init__(self):
            self._zset = {}

        def pipeline(self, transaction=True):  # noqa: A003
            return FakePipe(self)

        async def zrange(self, key, start, end, withscores=False):
            vals = sorted(self._zset.get(key, []))
            if not vals:
                return []
            ts = vals[0]
            return [("x", ts)] if withscores else ["x"]

    fake_instance = FakeRedis()

    async def fake_get_redis():
        return fake_instance

    from app.core import redis_client

    monkeypatch.setattr(redis_client, "get_redis", fake_get_redis, raising=False)
    monkeypatch.setattr(redis_client, "_redis", fake_instance, raising=False)

    # Prepare conversation via API
    conv_id = _create_conversation_via_api(client, title="Test RL")

    payload = {"role": "user", "content": "ping"}

    # Perform 4 sends -> 4th should 429
    for _ in range(3):
        r = client.post(f"/api/v1/conversations/{conv_id}/messages", json=payload)
        assert r.status_code == 200, r.text
    r = client.post(f"/api/v1/conversations/{conv_id}/messages", json=payload)
    assert r.status_code == 429
    assert r.headers.get("Retry-After") is not None
