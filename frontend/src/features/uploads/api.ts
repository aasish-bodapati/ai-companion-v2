import api from '@/lib/api';

export interface UploadOut {
  upload_id: string;
  filename: string;
  size: number;
  mime: string;
  checksum: string;
  created_at: string;
}

export interface UploadDetail extends UploadOut {
  status: 'stored' | 'processing' | 'ready';
  preview?: string | null;
}

export async function uploadFile(file: File): Promise<UploadOut> {
  const form = new FormData();
  form.append('file', file);
  return api.post<UploadOut>('/users/me/uploads', form);
}

export async function getUpload(uploadId: string): Promise<UploadDetail> {
  return api.get<UploadDetail>(`/users/me/uploads/${encodeURIComponent(uploadId)}`);
}

export interface AddToMemoryOut {
  status: string;
  faiss_id: string | null;
  consolidated: number;
}

export async function addUploadToMemory(
  uploadId: string,
  opts: { category?: string; importance?: number; consolidate?: boolean } = {}
): Promise<AddToMemoryOut> {
  // FastAPI endpoint reads simple query params for these fields
  const params: Record<string, any> = {};
  if (opts.category) params.category = opts.category;
  if (typeof opts.importance === 'number') params.importance = opts.importance;
  if (typeof opts.consolidate === 'boolean') params.consolidate = String(!!opts.consolidate);
  return api.post<AddToMemoryOut>(`/users/me/uploads/${encodeURIComponent(uploadId)}/add-to-memory`, undefined, {
    params,
  });
}
