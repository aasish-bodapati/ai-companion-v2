import pytest
from datetime import datetime, timezone, timedelta

# Uses the shared TestClient fixtures from tests/conftest.py:
# - client (auth overridden)
# - unauth_client (no auth -> 401 expected on protected routes)

API = "/api/v1"


def iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat().replace("+00:00", "Z")


# --------------------- Auth ---------------------

def test_coaching_endpoints_require_auth(unauth_client):
    # Pick a few protected endpoints to assert 401
    r1 = unauth_client.get(f"{API}/goals")
    assert r1.status_code == 401

    r2 = unauth_client.post(f"{API}/trackers/workouts", json={"when": iso(datetime.now(timezone.utc)), "type": "run"})
    assert r2.status_code == 401

    r3 = unauth_client.post(f"{API}/reviews/daily", json={"date": datetime.now().date().isoformat()})
    assert r3.status_code == 401


# --------------------- Goals ---------------------

def test_goals_create_list_update(client):
    # Create goal
    payload = {
        "name": "Run 5k in 30 minutes",
        "category": "fitness",
        "target_date": (datetime.now().date() + timedelta(days=30)).isoformat(),
        "notes": "3x/week training",
        "metrics": {"distance_km": 5, "time_min": 30},
    }
    resp = client.post(f"{API}/goals", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert set(body.keys()) == {"id", "status"}
    goal_id = body["id"]
    assert body["status"] in {"active", "paused", "completed"}

    # List goals
    resp = client.get(f"{API}/goals", params={"category": "fitness", "status": "active"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert any(g["id"] == goal_id for g in data)

    # Update goal (partial)
    resp = client.patch(f"{API}/goals/{goal_id}", json={"name": "5k under 28m", "notes": "shin splints"})
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


# --------------------- Routines ---------------------

def test_routines_create_list_update(client):
    # Create routine
    payload = {
        "name": "Run",
        "category": "fitness",
        "schedule": {"days": ["Mon", "Wed", "Fri"], "time": "07:00", "tz": "Asia/Kolkata"},
        "goal_id": None,
        "notes": None,
    }
    resp = client.post(f"{API}/routines", json=payload)
    assert resp.status_code == 201
    rid = resp.json().get("id")
    assert isinstance(rid, str) and len(rid) > 0

    # List routines
    resp = client.get(f"{API}/routines", params={"category": "fitness"})
    assert resp.status_code == 200
    routines = resp.json()
    assert isinstance(routines, list)
    assert any(r["id"] == rid for r in routines)
    # schedule should be object with keys
    one = next(r for r in routines if r["id"] == rid)
    assert set(one["schedule"].keys()) >= {"days", "time", "tz"}

    # Update routine (partial)
    resp = client.patch(f"{API}/routines/{rid}", json={"notes": "add light jog on Sat"})
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


# --------------------- Trackers ---------------------

def test_trackers_end_to_end(client):
    now = datetime.now(timezone.utc)
    start = (now - timedelta(days=2)).date().isoformat()
    end = (now + timedelta(days=1)).date().isoformat()

    # Workout
    w_payload = {
        "when": iso(now - timedelta(hours=5)),
        "type": "run",
        "duration_min": 30,
        "distance_km": 5.0,
        "intensity": "moderate",
        "notes": "easy pace",
    }
    r = client.post(f"{API}/trackers/workouts", json=w_payload)
    assert r.status_code == 201
    w_id = r.json().get("id")

    # Meal
    m_payload = {
        "when": iso(now - timedelta(hours=2)),
        "items": ["grilled chicken", "brown rice", "salad"],
        "est_protein_g": 40,
        "est_kcal": 650,
        "notes": "good protein",
    }
    r = client.post(f"{API}/trackers/meals", json=m_payload)
    assert r.status_code == 201

    # Hydration
    h_payload = {"when": iso(now - timedelta(hours=1)), "amount_ml": 500}
    r = client.post(f"{API}/trackers/hydration", json=h_payload)
    assert r.status_code == 201

    # Mood
    mood_payload = {
        "when": iso(now - timedelta(minutes=45)),
        "val": 3,
        "scale": 5,
        "tags": ["calm", "productive"],
        "notes": "solid day",
    }
    r = client.post(f"{API}/trackers/mood", json=mood_payload)
    assert r.status_code == 201

    # Journal
    j_payload = {
        "when": iso(now - timedelta(minutes=30)),
        "title": "Weekly Review",
        "content": "Felt better runs",
        "tags": ["fitness", "reflection"],
    }
    r = client.post(f"{API}/trackers/journal", json=j_payload)
    assert r.status_code == 201

    # Query ranges
    for kind in ["workouts", "meals", "hydration", "mood", "journal"]:
        r = client.get(f"{API}/trackers/{kind}", params={"from": start, "to": end, "limit": 100})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    # Specific: workout list includes the created one
    r = client.get(f"{API}/trackers/workouts", params={"from": start, "to": end})
    items = r.json()
    assert any(x["id"] == w_id for x in items)


# --------------------- Reviews ---------------------

def test_reviews_daily_and_weekly(client):
    # Daily
    resp = client.post(f"{API}/reviews/daily", json={"date": datetime.now().date().isoformat()})
    assert resp.status_code == 200
    body = resp.json()
    assert "suggestions" in body and isinstance(body["suggestions"], list)

    # Weekly
    payload = {"week_start": (datetime.now().date() - timedelta(days=7)).isoformat(), "domains": ["fitness", "nutrition", "mood"]}
    resp = client.post(f"{API}/reviews/weekly", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert set(body.keys()) >= {"summary", "adjustments", "insights"}


# --------------------- Actions ---------------------

def test_actions_execute_known_and_unknown(client):
    now = datetime.now(timezone.utc)

    # Known action: log workout
    payload = {
        "action": "fitness.log_workout",
        "params": {"when": iso(now), "type": "run", "duration_min": 20},
        "conversation_id": None,
        "client_action_id": None,
    }
    resp = client.post(f"{API}/actions/execute", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("ok") is True
    assert body.get("action") == "fitness.log_workout"
    assert isinstance(body.get("result", {}).get("id"), str)

    # Unknown action
    payload["action"] = "unknown.action"
    resp = client.post(f"{API}/actions/execute", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("ok") is False
    assert body.get("error", {}).get("message") in {"Unknown action", "Action failed"}
