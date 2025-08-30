"""RFC 7807 problem+json helper.

Use this helper to return standardized error responses with content-type
`application/problem+json`.

Example:
    from app.api.problem import problem_json
    return problem_json(
        status=400,
        title="Invalid request",
        detail="message content is required",
        type="https://example.com/problems/invalid-request",
        instance=f"/api/conversations/{conversation_id}/messages"
    )
"""

from typing import Any, Dict, Optional

from fastapi.responses import JSONResponse


def problem_json(
    *,
    status: int,
    title: str,
    detail: Optional[str] = None,
    type: str = "about:blank",
    instance: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None,
    extras: Optional[Dict[str, Any]] = None,
) -> JSONResponse:
    """Create an RFC 7807 Problem Details response.

    Args:
        status: HTTP status code.
        title: Short, human-readable summary of the problem.
        detail: Human-readable explanation specific to this occurrence.
        type: A URI reference that identifies the problem type.
        instance: A URI reference that identifies the specific occurrence.
        headers: Optional headers to include in the response.
        extras: Additional members for problem details (must not override standard keys).

    Returns:
        JSONResponse with media_type `application/problem+json`.
    """
    payload: Dict[str, Any] = {
        "type": type,
        "title": title,
        "status": status,
    }
    if detail is not None:
        payload["detail"] = detail
    if instance is not None:
        payload["instance"] = instance

    if extras:
        # Only add non-standard keys that don't collide with the standard set
        for k, v in extras.items():
            if k not in {"type", "title", "status", "detail", "instance"}:
                payload[k] = v

    return JSONResponse(
        content=payload, status_code=status, headers=headers, media_type="application/problem+json"
    )
