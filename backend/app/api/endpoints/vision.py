from __future__ import annotations

import base64
import mimetypes
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api import deps
from app.core.llm import generate_with_together_vision
from app.core.config import settings
from app.schemas.user import User as UserSchema  # type: ignore
from app.api.endpoints.uploads import _load_index  # reuse local upload index

router = APIRouter()


class VisionAnalyzeIn(BaseModel):
    image_url: Optional[str] = None
    upload_id: Optional[str] = None
    image_b64: Optional[str] = None  # raw base64 without header (data URL header will be added)
    prompt: Optional[str] = None
    model: Optional[str] = None


class VisionAnalyzeOut(BaseModel):
    text: str


def _data_url_for_upload(current_user_id: str, upload_id: str) -> Optional[str]:
    idx = _load_index(str(current_user_id))
    for it in idx.get("items", []):
        if it.get("upload_id") == upload_id:
            path = it.get("path")
            if not path:
                return None
            try:
                with open(path, "rb") as f:
                    data = f.read()
                mime = (
                    it.get("mime")
                    or mimetypes.guess_type(it.get("filename") or "")[0]
                    or "application/octet-stream"
                )
                b64 = base64.b64encode(data).decode("ascii")
                return f"data:{mime};base64,{b64}"
            except Exception:
                return None
    return None


@router.post("/vision/analyze", response_model=VisionAnalyzeOut)
async def analyze_image(
    *,
    current_user: UserSchema = Depends(deps.get_current_active_user),
    body: VisionAnalyzeIn,
):
    """
    Analyze an image via Llama Vision.
    Accepts one of: image_url, upload_id, image_b64.
    Returns concise text.
    """
    if not (body.image_url or body.upload_id or body.image_b64):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide image_url, upload_id, or image_b64",
        )

    # Resolve image URL preference order:
    # explicit URL > upload_id -> data URL > image_b64 -> data URL
    resolved_url: Optional[str] = None
    if body.image_url:
        resolved_url = body.image_url
    elif body.upload_id:
        resolved_url = _data_url_for_upload(str(current_user.id), body.upload_id)
        if not resolved_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found or unreadable"
            )
    elif body.image_b64:
        # best-effort mime default
        resolved_url = f"data:image/png;base64,{body.image_b64}"

    prompt = body.prompt or "Describe this image briefly."
    # Allow override via request, else use backend setting, else sensible default
    model = body.model or (settings.LLM_MODEL_VISION or "meta-llama/Llama-Vision-Free")

    try:
        out = generate_with_together_vision(
            model=model,
            system_prompt="You are a helpful vision assistant. Be concise.",
            prompt=prompt,
            image_url=resolved_url or "",
            max_tokens=128,
        )
        if not isinstance(out, str) or not out:
            raise ValueError("Empty response from vision model")
        return VisionAnalyzeOut(text=out)
    except Exception as e:
        # Return generic error without leaking provider details
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Vision analysis failed"
        ) from e
