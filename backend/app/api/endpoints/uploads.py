from __future__ import annotations

import os
import json
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api import deps
from app.memory.service import memory_service
from app.schemas.user import User as UserSchema  # type: ignore

router = APIRouter()

BASE_UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads")
)
MAX_UPLOAD_SIZE_MB = 10
ALLOWED_MIME_PREFIXES = ("text/", "image/")
ALLOWED_MIME_EXTRAS = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _user_dir(user_id: str) -> str:
    p = os.path.join(BASE_UPLOAD_DIR, str(user_id))
    os.makedirs(p, exist_ok=True)
    return p


def _index_path(user_id: str) -> str:
    return os.path.join(_user_dir(user_id), "index.json")


def _load_index(user_id: str) -> Dict[str, Any]:
    path = _index_path(user_id)
    if not os.path.exists(path):
        return {"items": []}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"items": []}


def _save_index(user_id: str, data: Dict[str, Any]) -> None:
    path = _index_path(user_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _sha256_of_bytes(data: bytes) -> str:
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()


def _extract_text_simple(filename: str, data: bytes, mime: Optional[str] = None) -> Optional[str]:
    name = filename.lower()
    if name.endswith((".txt", ".md", ".csv")):
        try:
            return data.decode("utf-8", errors="replace")
        except Exception:
            return None
    # PDF
    if name.endswith(".pdf") or mime == "application/pdf":
        try:
            try:
                from pdfminer.high_level import extract_text as _pdf_extract  # type: ignore
                import tempfile

                with tempfile.NamedTemporaryFile(suffix=".pdf", delete=True) as tmp:
                    tmp.write(data)
                    tmp.flush()
                    text = _pdf_extract(tmp.name)
                return text[:20000] if text else None
            except Exception:
                # Fallback using PyPDF2
                import io as _io
                from PyPDF2 import PdfReader  # type: ignore

                bio = _io.BytesIO(data)
                reader = PdfReader(bio)
                chunks: list[str] = []
                for page in reader.pages:
                    try:
                        chunks.append(page.extract_text() or "")
                    except Exception:
                        continue
                text = "\n".join(chunks)
                return text[:20000] if text else None
        except Exception:
            return None

    # DOCX
    if (
        name.endswith(".docx")
        or mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ):
        try:
            import io as _io
            from docx import Document  # type: ignore

            bio = _io.BytesIO(data)
            doc = Document(bio)
            text = "\n".join(p.text for p in doc.paragraphs if p.text)
            return text[:20000] if text else None
        except Exception:
            return None

    # Images with OCR (best-effort)
    if (mime and mime.startswith("image/")) or name.endswith(
        (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff")
    ):
        try:
            try:
                from PIL import Image  # type: ignore
                import io as _io

                img = Image.open(_io.BytesIO(data))
                # Try Tesseract if available
                try:
                    import pytesseract  # type: ignore

                    text = pytesseract.image_to_string(img)
                    return (text or "").strip()[:20000] or None
                except Exception:
                    # No OCR available; return None (will handle fallback at callsite)
                    return None
            except Exception:
                return None
        except Exception:
            return None

    # Unsupported type
    return None


@router.post("/users/me/uploads")
async def upload_file(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
    file: UploadFile = File(...),
):
    """Upload a file for the current user. Stores on disk and indexes metadata.
    Returns: { upload_id, filename, size, mime, checksum }
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    # Size limit
    max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {MAX_UPLOAD_SIZE_MB} MB limit",
        )
    # Type allowlist (basic)
    mime = file.content_type or "application/octet-stream"
    if not (mime.startswith(ALLOWED_MIME_PREFIXES) or mime in ALLOWED_MIME_EXTRAS):
        # allow upload but will likely be unsupported for extraction; still store safely
        pass

    user_dir = _user_dir(str(current_user.id))
    now = datetime.now(timezone.utc).isoformat()
    checksum = _sha256_of_bytes(content)
    upload_id = checksum[:16]
    safe_name = os.path.basename(file.filename or f"upload_{upload_id}")
    dest = os.path.join(user_dir, f"{upload_id}__{safe_name}")
    with open(dest, "wb") as f:
        f.write(content)

    idx = _load_index(str(current_user.id))
    # De-dup by checksum
    for it in idx.get("items", []):
        if it.get("checksum") == checksum:
            # already present; return existing record
            return {
                "upload_id": it.get("upload_id"),
                "filename": it.get("filename"),
                "size": it.get("size"),
                "mime": it.get("mime"),
                "checksum": it.get("checksum"),
                "created_at": it.get("created_at"),
            }

    rec = {
        "upload_id": upload_id,
        "filename": safe_name,
        "path": dest,
        "size": len(content),
        "mime": mime,
        "checksum": checksum,
        "created_at": now,
        "status": "stored",
    }
    idx.setdefault("items", []).insert(0, rec)
    _save_index(str(current_user.id), idx)

    return {
        "upload_id": upload_id,
        "filename": safe_name,
        "size": len(content),
        "mime": rec["mime"],
        "checksum": checksum,
        "created_at": now,
    }


@router.get("/users/me/uploads/{upload_id}")
async def get_upload(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
    upload_id: str,
):
    idx = _load_index(str(current_user.id))
    for it in idx.get("items", []):
        if it.get("upload_id") == upload_id:
            preview = None
            try:
                with open(it["path"], "rb") as f:
                    data = f.read(512 * 1024)  # limit preview read
                preview_text = _extract_text_simple(it["filename"], data, it.get("mime"))
                if preview_text:
                    preview = preview_text[:2000]
            except Exception:
                preview = None
            return {
                "upload_id": upload_id,
                "filename": it.get("filename"),
                "size": it.get("size"),
                "mime": it.get("mime"),
                "checksum": it.get("checksum"),
                "created_at": it.get("created_at"),
                "status": it.get("status", "stored"),
                "preview": preview,
            }
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")


@router.post("/users/me/uploads/{upload_id}/add-to-memory")
async def add_upload_to_memory(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
    upload_id: str,
    category: Optional[str] = None,
    importance: Optional[float] = None,
    core: Optional[bool] = False,
    consolidate: Optional[bool] = True,
):
    """Extract simple text and create a memory. Returns counts and faiss_id.
    Currently supports .txt/.md/.csv preview extraction only.
    """
    idx = _load_index(str(current_user.id))
    rec = next((it for it in idx.get("items", []) if it.get("upload_id") == upload_id), None)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")

    try:
        with open(rec["path"], "rb") as f:
            data = f.read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to read file"
        )

    text = _extract_text_simple(rec["filename"], data, rec.get("mime"))
    if not text:
        # Graceful fallback for images and other binaries: store a minimal descriptive memory
        mime = rec.get("mime") or ""
        if mime.startswith("image/"):
            text = f"Image uploaded: {rec.get('filename')}"
        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported file type for extraction",
            )

    # Metadata/provenance
    md: Dict[str, Any] = {
        "source": f"upload:{(category or 'general').lower()}",
        "upload_id": upload_id,
        "filename": rec.get("filename"),
        "checksum": rec.get("checksum"),
    }
    if importance is not None:
        try:
            md["importance"] = float(importance)
        except Exception:
            pass
    if core:
        md["core"] = True

    # Store memory
    faiss_id = memory_service.store_memory(
        db,
        content=text,
        content_type=(category or "document"),
        user_id=str(current_user.id),
        conversation_id=None,
        metadata=md,
    )

    consolidated = 0
    if consolidate:
        try:
            res = memory_service.consolidate_user_memories(
                db, user_id=str(current_user.id), limit=2000
            )
            consolidated = int(res.get("suppressed", 0)) if isinstance(res, dict) else 0
        except Exception:
            consolidated = 0

    return {
        "status": "ok",
        "faiss_id": faiss_id,
        "consolidated": consolidated,
    }
