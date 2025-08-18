from typing import List, Dict
import logging
import time

import httpx

from app.core.config import settings


logger = logging.getLogger(__name__)


def generate_with_together(
    model: str,
    system_prompt: str,
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 1024,
) -> str:
    """
    Generate a reply using Together AI. Falls back to a safe stub if not configured or on error.
    messages: list of {"role": "user"|"assistant"|"system", "content": str}
    """
    api_key = getattr(settings, "LLM_KEY", "")
    base_url = (getattr(settings, "LLM_BASE_URL", "") or "").strip()
    if not api_key and not base_url:
        logger.warning("LLM key and base_url missing; returning stub reply.")
        return "(stub) Memory-enabled reply: provider not configured."
    # If a custom base_url is provided, use OpenAI-compatible HTTP
    if base_url:
        try:
            headers = {"Content-Type": "application/json"}
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
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
            logger.info("llm.http.call.start model=%s messages=%d", model, len(chat_messages))
            with httpx.Client(base_url=base_url, timeout=60.0) as client:
                resp = client.post("/chat/completions", json=payload, headers=headers)
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            if resp.status_code >= 400:
                logger.error("llm.http.call.error status=%d body=%s", resp.status_code, resp.text)
                return "(stub) LLM generation failed; returning fallback reply."
            data = resp.json()
            choices = (data or {}).get("choices") or []
            if choices:
                c0 = choices[0]
                msg = c0.get("message") or {}
                content = msg.get("content") or c0.get("text")
                if content:
                    logger.info("llm.http.call.ok model=%s elapsed_ms=%d", model, elapsed_ms)
                    return content
            logger.warning(
                "llm.http.call.empty model=%s elapsed_ms=%d - no choices/content", model, elapsed_ms
            )
            return "(stub) No content returned by provider."
        except Exception as e:
            logger.error("llm.http.call.exception err=%s", str(e), exc_info=True)
            return "(stub) LLM generation failed; returning fallback reply."
    # Fallback to Together SDK when no base_url
    try:
        # Lazy import to avoid hard dependency in tests
        from together import Together

        client = Together(api_key=api_key)
        # Prepend system prompt as a system message if provided
        chat_messages = []
        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})
        chat_messages.extend(messages)

        start = time.perf_counter()
        logger.info("together.call.start model=%s messages=%d", model, len(chat_messages))
        completion = client.chat.completions.create(
            model=model,
            messages=chat_messages,
            temperature=0.7,
            top_p=0.9,
            max_tokens=max_tokens,
        )
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        if completion and getattr(completion, "choices", None):
            choice = completion.choices[0]
            content = None
            msg = getattr(choice, "message", None)
            if isinstance(msg, dict):
                content = msg.get("content")
            elif msg is not None:
                content = getattr(msg, "content", None)
            if not content:
                content = getattr(choice, "text", None)
            if content:
                logger.info("together.call.ok model=%s elapsed_ms=%d", model, elapsed_ms)
                return content
        logger.warning(
            "together.call.empty model=%s elapsed_ms=%d - no choices/content", model, elapsed_ms
        )
        return "(stub) No content returned by Together."
    except Exception as e:
        logger.error("together.call.error err=%s", str(e), exc_info=True)
        return "(stub) LLM generation failed; returning fallback reply."


def generate_with_together_stream(
    model: str,
    system_prompt: str,
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 1024,
) -> "List[str]":
    """
    Stream a reply from Together AI, yielding small content chunks.
    If the API key is missing or an error occurs, yield a short stub once.
    """
    api_key = getattr(settings, "LLM_KEY", "")
    base_url = (getattr(settings, "LLM_BASE_URL", "") or "").strip()
    if not api_key and not base_url:
        logger.warning("LLM key and base_url missing; streaming stub reply.")
        yield "(stub) Streaming disabled: provider not configured."
        return
    # HTTP streaming path for OpenAI-compatible providers
    if base_url:
        try:
            headers = {"Content-Type": "application/json"}
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
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
            logger.info("llm.http.stream.start model=%s messages=%d", model, len(chat_messages))
            with httpx.stream(
                "POST", f"{base_url}/chat/completions", json=payload, headers=headers, timeout=60.0
            ) as r:
                if r.status_code >= 400:
                    # Safely read error body from streaming response
                    body_bytes = b""
                    try:
                        body_bytes = r.read()
                    except Exception:
                        body_bytes = b""
                    body_preview = None
                    try:
                        body_preview = body_bytes.decode("utf-8", errors="ignore")[:1000]
                    except Exception:
                        body_preview = None
                    logger.error(
                        "llm.http.stream.error status=%d body=%s", r.status_code, body_preview
                    )
                    # Graceful handling for rate limits: brief backoff then try non-streaming once
                    if r.status_code == 429:
                        time.sleep(1.0)
                        try:
                            fallback = generate_with_together(
                                model, system_prompt, messages, max_tokens=max_tokens
                            )
                            yield fallback or "(stub) Rate limited; please retry."
                            return
                        except Exception:
                            yield "(stub) Rate limited; please retry."
                            return
                    yield "(stub) Streaming failed; returning fallback."
                    return
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
            logger.info("llm.http.stream.end model=%s", model)
            return
        except Exception as e:
            logger.error("llm.http.stream.exception err=%s", str(e), exc_info=True)
            yield "(stub) Streaming failed; returning fallback."
            return

    # Fallback to Together SDK streaming when no base_url
    try:
        from together import Together

        client = Together(api_key=api_key)

        chat_messages = []
        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})
        chat_messages.extend(messages)

        logger.info("together.stream.start model=%s messages=%d", model, len(chat_messages))
        # Minimal retry for transient rate limits
        max_retries = 2
        attempt = 0
        while True:
            try:
                stream = client.chat.completions.create(
                    model=model,
                    messages=chat_messages,
                    temperature=0.7,
                    top_p=0.9,
                    max_tokens=max_tokens,
                    stream=True,
                )
                break
            except Exception as ce:
                msg = str(ce)
                is_rate = "RateLimit" in msg or "429" in msg or "model_rate_limit" in msg
                if is_rate and attempt < max_retries:
                    delay = 1.5 * (2**attempt)
                    logger.info(
                        "together.stream.retry due to rate limit attempt=%d delay=%.2fs",
                        attempt + 1,
                        delay,
                    )
                    time.sleep(delay)
                    attempt += 1
                    continue
                raise

        for ev in stream:
            try:
                # OpenAI-compatible delta format
                chunk = None
                choice = None
                if isinstance(ev, dict):
                    choices = ev.get("choices") or []
                    if choices:
                        choice = choices[0]
                else:
                    choices = getattr(ev, "choices", None)
                    if choices:
                        choice = choices[0]
                if choice is not None:
                    delta = getattr(choice, "delta", None)
                    if isinstance(delta, dict):
                        chunk = delta.get("content")
                    elif delta is not None:
                        chunk = getattr(delta, "content", None)
                    if not chunk:
                        chunk = getattr(choice, "text", None)
                if chunk:
                    yield chunk
            except Exception as ie:
                logger.debug("together.stream.parse_chunk.error %s", str(ie))
                continue
        logger.info("together.stream.end model=%s", model)
    except Exception as e:
        logger.error("together.stream.error err=%s", str(e), exc_info=True)
        yield "(stub) Together streaming failed; returning fallback."


def generate_with_together_vision(
    model: str,
    system_prompt: str,
    prompt: str,
    image_url: str,
    *,
    max_tokens: int = 512,
) -> str:
    """
    Vision inference using Together with an image URL.
    Builds OpenAI-compatible messages for providers with base_url, or uses Together SDK otherwise.
    Returns generated text or a stub on failure.
    """
    api_key = getattr(settings, "LLM_KEY", "")
    base_url = (getattr(settings, "LLM_BASE_URL", "") or "").strip()
    if not api_key and not base_url:
        logger.warning("LLM key and base_url missing; returning stub for vision call.")
        return "(stub) Vision reply: provider not configured."
    chat_messages = []
    if system_prompt:
        chat_messages.append({"role": "system", "content": system_prompt})
    chat_messages.append(
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                # Ollama expects nested object form: { image_url: { url: "..." } }
                {"type": "image_url", "image_url": {"url": image_url}},
            ],
        }
    )

    if base_url:
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": model,
                "messages": chat_messages,
                "temperature": 0.2,
                "top_p": 0.9,
                "max_tokens": max_tokens,
                "stream": False,
            }
            start = time.perf_counter()
            logger.info("llm.vision.http.call.start model=%s", model)
            with httpx.Client(base_url=base_url, timeout=60.0) as client:
                resp = client.post("/chat/completions", json=payload, headers=headers)
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            if resp.status_code >= 400:
                logger.error(
                    "llm.vision.http.call.error status=%d body=%s", resp.status_code, resp.text
                )
                return "(stub) Vision generation failed."
            data = resp.json()
            choices = (data or {}).get("choices") or []
            if choices:
                c0 = choices[0]
                msg = c0.get("message") or {}
                content = msg.get("content") or c0.get("text")
                if content:
                    logger.info("llm.vision.http.call.ok model=%s elapsed_ms=%d", model, elapsed_ms)
                    return content
            logger.warning("llm.vision.http.empty model=%s elapsed_ms=%d", model, elapsed_ms)
            return "(stub) No content returned by provider (vision)."
        except Exception as e:
            logger.error("llm.vision.http.exception err=%s", str(e), exc_info=True)
            return "(stub) Vision generation failed."

    # Together SDK path (SDK's ChatCompletionRequest expects string content; use string fallback)
    try:
        from together import Together

        client = Together(api_key=api_key)
        start = time.perf_counter()
        logger.info("together.vision.call.start model=%s", model)
        sdk_messages = []
        if system_prompt:
            sdk_messages.append({"role": "system", "content": system_prompt})
        # Fallback to string content to satisfy SDK validation
        sdk_messages.append(
            {
                "role": "user",
                "content": f"{prompt}\n[Image URL]: {image_url}",
            }
        )

        completion = client.chat.completions.create(
            model=model,
            messages=sdk_messages,
            temperature=0.2,
            top_p=0.9,
            max_tokens=max_tokens,
        )
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        if completion and getattr(completion, "choices", None):
            choice = completion.choices[0]
            content = None
            msg = getattr(choice, "message", None)
            if isinstance(msg, dict):
                content = msg.get("content")
            elif msg is not None:
                content = getattr(msg, "content", None)
            if not content:
                content = getattr(choice, "text", None)
            if content:
                logger.info("together.vision.call.ok model=%s elapsed_ms=%d", model, elapsed_ms)
                return content
        logger.warning("together.vision.call.empty model=%s elapsed_ms=%d", model, elapsed_ms)
        return "(stub) No content returned by Together (vision)."
    except Exception as e:
        logger.error("together.vision.call.error err=%s", str(e), exc_info=True)
        return "(stub) Vision generation failed."
