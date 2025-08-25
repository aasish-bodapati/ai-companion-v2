import os
import pytest

from app.core.llm import generate_with_openrouter_vision


@pytest.mark.skipif(
    os.getenv("VISION_TEST") != "1", reason="VISION_TEST!=1; skipping external vision call"
)
@pytest.mark.timeout(60)
def test_llama_vision_live_call():
    """
    Optional live test. Requires:
    - env LLM_KEY set (OpenRouter key)
    - env VISION_MODEL set to a vision-capable model name
    - optionally env LLM_BASE_URL for OpenAI-compatible providers

    Run: VISION_TEST=1 VISION_MODEL=meta-llama/Llama-3.2-11B-Vision-Instruct pytest -q tests/test_llama_vision.py
    """
    model = os.getenv("VISION_MODEL")
    if not model:
        pytest.skip("VISION_MODEL not set; skipping")

    # Use a small, public image
    img_url = (
        "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png"
    )
    out = generate_with_openrouter_vision(
        model=model,
        system_prompt="You are a vision assistant. Be concise.",
        prompt="Describe the image in one short sentence.",
        image_url=img_url,
        max_tokens=64,
    )
    assert isinstance(out, str)
    assert len(out) > 0
    # If key is missing, our helper returns a stub; catch that explicitly
    assert "stub" not in out.lower(), f"Vision call likely failed: {out}"
