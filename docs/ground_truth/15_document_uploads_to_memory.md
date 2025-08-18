# Document & Image Uploads to Memory

This document describes the UX, API, and security for uploading documents/images and adding extracted text as user memories.

---

## UX Surfaces
- Preferences › Documents (`/profile/documents`)
  - Drag-and-drop or button upload.
  - Shows file metadata and a text preview when available.
  - After review, click "Add to Memory" with options: category, importance, pin to Core.
- Chat Attach (future)
  - Inline upload from chat with quick preview and "Add to Memory".

## Flow
1) Upload file (multipart).
2) Preview extraction (lightweight text extraction supported initially).
3) Add to Memory creates one or more memory items with provenance and optional Core.
4) Lifecycle maintenance runs consolidation to dedupe.

## Frontend
- Route: `frontend/src/app/profile/documents/page.tsx`
  - Upload via `uploadFile()`.
  - Fetch preview via `getUpload()`.
  - Add to memory via `addUploadToMemory()` with { category, importance, core, consolidate }.
- API client: `frontend/src/features/uploads/api.ts`

## Backend
- Router: `backend/app/api/endpoints/uploads.py` registered in `api_v1/api.py` (tag "uploads").
- Endpoints (JWT required):
  - POST `/api/v1/users/me/uploads` (multipart)
    - Returns: { upload_id, filename, size, mime, checksum, created_at }
  - GET `/api/v1/users/me/uploads/{upload_id}`
    - Returns preview for supported types.
  - POST `/api/v1/users/me/uploads/{upload_id}/add-to-memory`
    - Query params: category, importance, core, consolidate
    - Returns: { status, faiss_id, consolidated }
- Storage: `backend/app/uploads/<user_id>/` with `index.json` per-user.
- Provenance in memory metadata: { source: `upload:{category}`, upload_id, filename, checksum }.
- Consolidation: calls `MemoryService.consolidate_user_memories()` after add.

## Supported Formats
- `.txt`, `.md`, `.csv` with UTF-8 decoding.
- `.pdf` via `pdfminer.six` with PyPDF2 fallback.
- `.docx` via `python-docx`.
- Images (`.png`, `.jpg`, `.jpeg`, `.webp`) via OCR using Tesseract (`pytesseract`). If OCR fails, a fallback placeholder is stored and preview notes extraction failure.

## Security & Privacy
- JWT enforced for all endpoints.
- Size/type limits recommended at reverse proxy.
- Do not log secrets; redact personal data in logs.
- Consider virus scanning (e.g., ClamAV) before extraction in production.
- HTTPS in production.

## Interaction with Memory Lifecycle
- Per-user caps and soft-forget continue to apply.
- Consolidation merges duplicates by checksum/consolidation key.
- Importance/Core selections affect promotion and retrieval boosts.

## Known Limitations
- OCR requires Tesseract installed on the host and available on PATH. If missing, image extraction will degrade to a placeholder and log a warning.
- Local filesystem storage in dev; switch to S3/GCS in prod.

### Windows (OCR) Setup
To enable OCR locally on Windows:
1) Install Tesseract OCR for Windows (e.g., from https://github.com/UB-Mannheim/tesseract/wiki).
2) Ensure the install path (e.g., `C:\\Program Files\\Tesseract-OCR`) is added to the system `PATH`.
3) Verify by running `tesseract --version` in a new terminal.
4) Restart the dev server if it was running.

## References
- `frontend/src/app/profile/documents/page.tsx`
- `frontend/src/features/uploads/api.ts`
- `backend/app/api/endpoints/uploads.py`
- `backend/app/api/api_v1/api.py`
- `backend/app/memory/service.py` (store_memory, consolidate)
