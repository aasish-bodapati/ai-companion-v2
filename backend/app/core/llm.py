from typing import List, Dict
import logging
import time

import httpx

from app.core.config import settings
from app.core.metrics import record_llm_call


logger = logging.getLogger(__name__)

# Exposed flag for diagnostics: whether last non-streaming generation used the local stub
LAST_USED_STUB: bool = False


def _local_stub_reply(system_prompt: str, messages: List[Dict[str, str]], max_tokens: int) -> str:
    """Offline fallback: generate a short, helpful reply without calling a provider.
    Keeps responses concise and actionable for dev mode.
    """
    # Find latest user message
    user_text = ""
    for m in reversed(messages or []):
        if (m or {}).get("role") == "user":
            user_text = (m.get("content") or "").strip()
            break

    # Very small heuristic based on request type
    ask = user_text.lower()
    if not ask:
        core = "Got it."
    elif any(k in ask for k in ["remind", "reminder", "todo", "task"]):
        core = (
            "Added a reminder to your list."
        )
    elif any(k in ask for k in ["explain", "what is", "what's", "define"]):
        core = (
            "Here's a simple explanation with a quick takeaway."
        )
    elif any(k in ask for k in ["plan", "steps", "routine", "how do i"]):
        core = "Here's a tiny plan you can follow."
    else:
        core = "Happy to help."

    bullets: List[str] = []
    if any(k in ask for k in ["overwhelm", "stress", "reset"]):
        bullets = [
            "Take 3 deep breaths (box breathing 4-4-4-4)",
            "Write 1–3 priorities for the next hour",
            "Start with a 5‑minute micro-task to build momentum",
        ]
    elif any(k in ask for k in ["routine", "morning", "evening"]):
        bullets = [
            "Hydrate and light stretch (2–3 min)",
            "Prioritize 1 task (write it down)",
            "Quick win: 5‑minute progress on that task",
        ]
    elif any(k in ask for k in ["explain", "what is", "what's", "define"]):
        bullets = [
            "Give a one‑sentence definition",
            "Name a practical use‑case",
            "Offer 1 next step if they want to go deeper",
        ]
    else:
        bullets = [
            "Clarify the goal in one line",
            "List a tiny next step (≤5 min)",
            "Set a lightweight reminder if useful",
        ]

    question = "Want me to turn this into a quick task or reminder?"

    # Compose concise markdown reply
    lines = [core, "", "- " + bullets[0], "- " + bullets[1], "- " + bullets[2], "", question]
    text = "\n".join(lines)
    # keep within max_tokens rough limit by truncating characters if needed
    if len(text) > max_tokens * 4:
        text = text[: max_tokens * 4]
    return text


def generate_with_openrouter(
    model: str,
    system_prompt: str,
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 1024,
) -> str:
    """
    Generate a reply using OpenRouter API (DeepSeek R1 Free).
    messages: list of {"role": "user"|"assistant"|"system", "content": str}
    """
    global LAST_USED_STUB
    api_key = getattr(settings, "LLM_KEY", "")
    base_url = (getattr(settings, "LLM_BASE_URL", "") or "").strip()
    
    if not api_key or not base_url:
        # Dev-friendly fallback: no outbound call, still produce a good, concise reply
        logger.warning("LLM credentials/base URL missing — using local stub reply")
        LAST_USED_STUB = True
        text = _local_stub_reply(system_prompt, messages, max_tokens)
        try:
            record_llm_call(model=model, latency_ms=0.0)
        except Exception:
            pass
        return text
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        chat_messages: list[dict] = []
        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})
        chat_messages.extend(messages)

        payload = {
            "model": model,
            "messages": chat_messages,
            "temperature": 0.7,
            "top_p": 0.9,
            "max_tokens": max_tokens,
            "stream": False,
        }
        
        start = time.perf_counter()
        logger.info("llm.openrouter.call.start model=%s messages=%d", model, len(chat_messages))

        # Minimal retry for transient errors
        attempt = 0
        resp = None
        with httpx.Client(base_url=base_url, timeout=120.0) as client:
            while True:
                attempt += 1
                try:
                    resp = client.post("chat/completions", json=payload, headers=headers)
                except Exception as _http_e:
                    if attempt < 3:
                        time.sleep(0.6 * attempt)
                        continue
                    raise

                # Retry on 429/5xx
                if resp.status_code in (429, 502, 503, 504) and attempt < 3:
                    time.sleep(0.6 * attempt)
                    continue
                break

        elapsed_ms = int((time.perf_counter() - start) * 1000)

        if resp is None:
            raise Exception("OpenRouter: no response object")

        if resp.status_code >= 400:
            body_preview = (resp.text or "")[:800]
            logger.error("llm.openrouter.call.error status=%d body=%s", resp.status_code, body_preview)
            raise Exception(f"OpenRouter API error: {resp.status_code} - {body_preview}")
        
        data = resp.json()
        choices = (data or {}).get("choices") or []
        usage = (data or {}).get("usage") or {}
        pt = usage.get("prompt_tokens") if isinstance(usage, dict) else None
        ct = usage.get("completion_tokens") if isinstance(usage, dict) else None
        
        if choices:
            c0 = choices[0]
            msg = c0.get("message") or {}
            content = msg.get("content") or c0.get("text")
            if content:
                LAST_USED_STUB = False
                logger.info("llm.openrouter.call.ok model=%s elapsed_ms=%d", model, elapsed_ms)
                try:
                    record_llm_call(model=model, prompt_tokens=pt, completion_tokens=ct, latency_ms=elapsed_ms)
                except Exception:
                    pass
                return content
        
        logger.warning("llm.openrouter.call.empty model=%s elapsed_ms=%d - no choices/content", model, elapsed_ms)
        try:
            record_llm_call(model=model, prompt_tokens=pt, completion_tokens=ct, latency_ms=elapsed_ms)
        except Exception:
            pass
        raise Exception("No content returned by OpenRouter API")
        
    except Exception as e:
        logger.error("llm.openrouter.call.exception err=%s", str(e), exc_info=True)
        raise


def last_call_used_stub() -> bool:
    """Return True if the last non-streaming generation used the local stub."""
    return LAST_USED_STUB


def _build_critique_prompt(draft: str) -> str:
    """Internal: build a concise self-critique prompt for refinement."""
    return (
        "You are reviewing the assistant's draft reply.\n"
        "- Identify any factual gaps, missing constraints, or ungrounded claims.\n"
        "- List concrete improvements in bullets.\n"
        "- If grounding is weak, note what clarifying question to ask.\n\n"
        f"Draft reply:\n---\n{draft}\n---\n"
        "Return only the critique and improvement bullets."
    )


def _build_refine_prompt(draft: str, critique: str) -> str:
    """Internal: build a refinement prompt that applies the critique."""
    return (
        "Refine the assistant reply using the critique.\n"
        "- Fix gaps and ground claims in provided context.\n"
        "- Keep it concise, actionable, and professional.\n"
        "- If clarification is needed, include one clarifying question at the end.\n\n"
        f"Critique:\n---\n{critique}\n---\n"
        f"Original draft:\n---\n{draft}\n---\n"
        "Produce the final refined reply only."
    )


def generate_with_critique_and_refine(
    model: str,
    system_prompt: str,
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 1024,
) -> str:
    """
    Two-pass generation: draft -> critique -> refine.
    Falls back to single-pass if any step fails. Uses the same provider.
    """
    try:
        # 1) Draft
        draft = generate_with_openrouter(
            model=model,
            system_prompt=system_prompt,
            messages=messages,
            max_tokens=max_tokens,
        )

        # 2) Critique
        critique_prompt = _build_critique_prompt(draft)
        critique_messages = messages + [{"role": "user", "content": critique_prompt}]
        critique = generate_with_openrouter(
            model=model,
            system_prompt=system_prompt,
            messages=critique_messages,
            max_tokens=max_tokens // 2,
        )

        # 3) Refine
        refine_prompt = _build_refine_prompt(draft, critique)
        refine_messages = messages + [{"role": "user", "content": refine_prompt}]
        final = generate_with_openrouter(
            model=model,
            system_prompt=system_prompt,
            messages=refine_messages,
            max_tokens=max_tokens,
        )
        return final or draft
    except Exception:
        # Safe fallback to single-pass
        return generate_with_openrouter(
            model=model,
            system_prompt=system_prompt,
            messages=messages,
            max_tokens=max_tokens,
        )

def generate_with_openrouter_stream(
    model: str,
    system_prompt: str,
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 1024,
):
    """
    Stream tokens from OpenRouter API (DeepSeek R1 Free).
    messages: list of {"role": "user", "assistant"|"system", "content": str}
    """
    api_key = getattr(settings, "LLM_KEY", "")
    base_url = (getattr(settings, "LLM_BASE_URL", "") or "").strip()
    
    if not api_key:
        logger.error("LLM_KEY is not configured")
        raise ValueError("LLM_KEY is required for OpenRouter API")
    
    if not base_url:
        logger.error("LLM_BASE_URL is not configured")
        raise ValueError("LLM_BASE_URL is required for OpenRouter API")
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        chat_messages: list[dict] = []
        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})
        chat_messages.extend(messages)

        payload = {
            "model": model,
            "messages": chat_messages,
            "temperature": 0.7,
            "top_p": 0.9,
            "max_tokens": max_tokens,
            "stream": True,
        }
        
        start = time.perf_counter()
        logger.info("llm.openrouter.stream.start model=%s messages=%d", model, len(chat_messages))
        
        with httpx.Client(base_url=base_url, timeout=120.0) as client:
            with client.stream("POST", "chat/completions", json=payload, headers=headers) as r:
                if r.status_code >= 400:
                    body_bytes = b""
                    try:
                        for chunk in r.iter_bytes():
                            body_bytes += chunk
                    except Exception:
                        body_bytes = b""
                    
                    body_preview = None
                    try:
                        body_preview = body_bytes.decode("utf-8", errors="ignore")[:1000]
                    except Exception:
                        body_preview = None
                    
                    logger.error("llm.openrouter.stream.error status=%d body=%s", r.status_code, body_preview)
                    raise Exception(f"OpenRouter streaming API error: {r.status_code} - {body_preview}")
                
                for line in r.iter_lines():
                    if not line:
                        continue
                    if isinstance(line, bytes):
                        try:
                            line = line.decode("utf-8")
                        except Exception:
                            continue
                    
                    if line.startswith("data: "):
                        data_str = line[len("data: ") :].strip()
                        if data_str == "[DONE]":
                            break
                        
                        try:
                            import json as _json
                            obj = _json.loads(data_str)
                        except Exception:
                            continue
                        
                        choices = obj.get("choices") or []
                        if choices:
                            delta = choices[0].get("delta") or {}
                            chunk = delta.get("content") or choices[0].get("text")
                            if chunk:
                                yield chunk
        
        logger.info("llm.openrouter.stream.end model=%s", model)
        try:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            record_llm_call(model=model, latency_ms=elapsed_ms)
        except Exception:
            pass
        
    except Exception as e:
        logger.error("llm.openrouter.stream.exception err=%s", str(e), exc_info=True)
        raise


def generate_with_openrouter_vision(
    model: str,
    system_prompt: str,
    prompt: str,
    image_url: str,
    *,
    max_tokens: int = 512,
) -> str:
    """
    Vision inference using OpenRouter API (DeepSeek R1 Free).
    """
    api_key = getattr(settings, "LLM_KEY", "")
    base_url = (getattr(settings, "LLM_BASE_URL", "") or "").strip()
    
    if not api_key:
        logger.error("LLM_KEY is not configured")
        raise ValueError("LLM_KEY is required for OpenRouter API")
    
    if not base_url:
        logger.error("LLM_BASE_URL is not configured")
        raise ValueError("LLM_BASE_URL is required for OpenRouter API")
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        chat_messages = []
        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})
        chat_messages.append(
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }
        )

        payload = {
            "model": model,
            "messages": chat_messages,
            "temperature": 0.2,
            "top_p": 0.9,
            "max_tokens": max_tokens,
            "stream": False,
        }
        
        start = time.perf_counter()
        logger.info("llm.openrouter.vision.start model=%s", model)
        
        with httpx.Client(base_url=base_url, timeout=60.0) as client:
            resp = client.post("chat/completions", json=payload, headers=headers)
        
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        
        if resp.status_code >= 400:
            logger.error("llm.openrouter.vision.error status=%d body=%s", resp.status_code, resp.text)
            raise Exception(f"OpenRouter vision API error: {resp.status_code} - {resp.text}")
        
        data = resp.json()
        choices = (data or {}).get("choices") or []
        
        if choices:
            c0 = choices[0]
            msg = c0.get("message") or {}
            content = msg.get("content") or c0.get("text")
            if content:
                logger.info("llm.openrouter.vision.ok model=%s elapsed_ms=%d", model, elapsed_ms)
                try:
                    record_llm_call(model=model, prompt_tokens=pt, completion_tokens=ct, latency_ms=elapsed_ms)
                except Exception:
                    pass
                return content
        
        logger.warning("llm.openrouter.vision.empty model=%s elapsed_ms=%d", model, elapsed_ms)
        try:
            record_llm_call(model=model, prompt_tokens=pt, completion_tokens=ct, latency_ms=elapsed_ms)
        except Exception:
            pass
        raise Exception("No content returned by OpenRouter vision API")
        
    except Exception as e:
        logger.error("llm.openrouter.vision.exception err=%s", str(e), exc_info=True)
        raise
