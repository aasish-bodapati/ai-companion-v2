import json


def test_auto_summarize_creates_memory(client):
    # Create a conversation
    r = client.post("/api/v1/conversations/", json={"title": "Summ Test"})
    assert r.status_code in (200, 201)
    conv = r.json()
    cid = conv["id"]

    # Add a few messages
    msgs = [
        {"role": "user", "content": "We discussed setting up a workout plan."},
        {"role": "assistant", "content": "We can do 3 days a week: Mon, Wed, Fri."},
        {"role": "user", "content": "Track progress weekly and adjust diet."},
    ]
    for m in msgs:
        rr = client.post(f"/api/v1/conversations/{cid}/messages", json=m)
        assert rr.status_code in (200, 201)

    # Call auto-summarize
    rr = client.post(f"/api/v1/conversations/{cid}/auto-summarize", json={})
    assert rr.status_code in (200, 201), rr.text
    node = rr.json()

    # Basic schema checks
    assert node.get("id")
    assert node.get("content")
    assert node.get("user_id")
    assert node.get("conversation_id") == cid
    meta = node.get("memory_metadata") or {}
    if isinstance(meta, str):
        try:
            meta = json.loads(meta)
        except Exception:
            # leave as-is for assertion message
            pass
    assert isinstance(meta, dict), f"metadata not object: {meta!r}"
    # LLM metadata included
    assert meta.get("source") == "auto_summary"
    assert "llm" in meta
