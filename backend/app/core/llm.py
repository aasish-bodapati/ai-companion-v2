from typing import List, Dict

from app.core.config import settings


def generate_with_together(
    model: str,
    system_prompt: str,
    messages: List[Dict[str, str]],
) -> str:
    """
    Generate a reply using Together AI. Falls back to a safe stub if not configured or on error.
    messages: list of {"role": "user"|"assistant"|"system", "content": str}
    """
    api_key = getattr(settings, "TOGETHER_API_KEY", "")
    if not api_key:
        return "(stub) Memory-enabled reply: Together API key not configured."
    try:
        # Lazy import to avoid hard dependency in tests
        from together import Together

        client = Together(api_key=api_key)
        # Prepend system prompt as a system message if provided
        chat_messages = []
        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})
        chat_messages.extend(messages)

        # The Together client supports OpenAI-compatible chat completions
        completion = client.chat.completions.create(
            model=model,
            messages=chat_messages,
            temperature=0.7,
            top_p=0.9,
        )
        # Extract content
        if completion and getattr(completion, "choices", None):
            return completion.choices[0].message["content"]  # type: ignore[index]
        return "(stub) No content returned by Together."
    except Exception:
        return "(stub) Together generation failed; returning fallback reply."


