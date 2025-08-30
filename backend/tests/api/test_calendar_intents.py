def test_intents_normalize_no_persist(client):
    resp = client.post(
        "/api/v1/calendar/intents",
        json={
            "text": "2025-08-20 09:00-10:00 Team sync",
            "default_duration_minutes": 30,
            "persist": False,
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "items" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item["title"].lower().startswith("team")
    assert item["start"].startswith("2025-08-20")
    assert item["end"].startswith("2025-08-20")
    assert data.get("persisted_event_ids") in (None, [])


def test_intents_persist_and_list(client):
    # Create via intents with persist
    resp = client.post(
        "/api/v1/calendar/intents",
        json={
            "text": "tomorrow 1pm Gym",
            "default_duration_minutes": 45,
            "persist": True,
            "description": "Leg day",
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    ids = data.get("persisted_event_ids")
    assert ids and isinstance(ids, list)

    # List events and ensure at least one matches
    list_resp = client.get("/api/v1/calendar/events")
    assert list_resp.status_code == 200
    events = list_resp.json()
    assert any(e["id"] in ids for e in events)


def test_intents_requires_auth(unauth_client):
    resp = unauth_client.post(
        "/api/v1/calendar/intents",
        json={"text": "today 12:00 Lunch", "persist": False},
    )
    # Should be 401 when no auth override
    assert resp.status_code in (401, 403)
