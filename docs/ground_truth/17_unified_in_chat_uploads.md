# Unified In-Chat Uploads Workflow (MVP)

This document defines the single, canonical workflow for uploading documents/images directly
from chat using a persistent attachments tray, selecting basic metadata via defaults, adding to
memory, and sending a chat message.

## Scope
- Replaces the separate Documents page.
- Uses a persistent attachments tray above the chat input (ChatGPT-style).
- Aligns with Brain Meter lifecycle and provenance documentation.

## UX Flow
1. User clicks the paperclip in chat and selects one or more files.
2. Selected files appear as chips in a persistent attachments tray above the input.
   - Each chip shows filename and file-type icon.
   - Chips can be removed before sending.
3. Optional toggles (in the tray):
   - "Analyze images" (default ON) to run vision analysis for image attachments.
   - "Remember" (default ON) to save attachments and analysis to memory.
4. On send:
   - Files are uploaded (if not already) and added to memory with defaults.
   - If "Analyze images" is ON, image analyses are appended to the outgoing message.
   - A compact "[Attached files: ...]" line is appended to the message.
5. Brain Meter digest refreshes after memory changes.

## Supported Types
- `image/*` (OCR, requires Tesseract installed on host)
- `.pdf`, `.docx`, `.txt`, `.md`, `.csv`

See `docs/ground_truth/15_document_uploads_to_memory.md` for storage, security, and OCR details.

## API Contracts
- Upload: `POST /api/v1/uploads` (frontend: `uploadFile()`)
- Upload detail/preview: `GET /api/v1/uploads/{upload_id}` (frontend: `getUpload()`)
- Add to memory:
  `POST /api/v1/uploads/{upload_id}/add-to-memory?category&importance&core&consolidate`
  (frontend: `addUploadToMemory()`)
- Refresh Brain Meter: `GET /api/v1/memory/digest` (frontend: `getMemoryDigest()`)

## Frontend Implementation
- Chat area supports multiple file selection via `<input type="file" multiple>`.
- Persistent attachments tray renders selected files as removable chips.
- On send:
  - Calls `addUploadToMemory()` for each file if "Remember" is ON.
  - Calls the vision API for images if "Analyze images" is ON.
  - Sends the message via streamed chat send.
- Digest is refreshed after memory changes.

## Defaults
- Remember: ON (saves uploads/analysis to memory by default)
- Category: `DEFAULT_UPLOAD_CATEGORY` (currently `document`)
- Importance: `DEFAULT_IMPORTANCE` (1.0)
- Core: `DEFAULT_CORE` (false)
- Consolidation: `DEFAULT_CONSOLIDATE` (true)

## Security
- JWT required on all protected endpoints.
- Never log passwords or tokens.
- Use HTTPS in production.

## Feature Parity & Removals
- The navigation link to Documents is removed. The route may remain for internal use but is not linked in the UI.
- All future enhancements to uploads should extend this modal + chat message pattern.

## Known Limitations
- Preview length limited to keep UI responsive.
- OCR depends on system Tesseract availability.
- Virus scanning for uploads is planned but not yet implemented.

## Testing Checklist
- Single file upload: preview, metadata set, added to memory, chat message sent, digest refreshes.
- Multiple files: each file opens modal sequentially, next starts after confirm/cancel.
- Error cases: upload failure, preview failure (fallback), add-to-memory failure (toast), modal continues with next file on cancel.
