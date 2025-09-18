import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
// Upload and vision APIs removed for Milestone 1 simplicity
type UploadDetail = any;
type UploadOut = any;
const uploadFile = (...args: any[]) => Promise.resolve({ upload_id: 'mock' });
const addUploadToMemory = (...args: any[]) => Promise.resolve();
const getUpload = (...args: any[]) => Promise.resolve({});
const analyzeImage = (...args: any[]) => Promise.resolve({});
const DEFAULT_CONSOLIDATE = '';
const DEFAULT_IMPORTANCE = 0;
const DEFAULT_UPLOAD_CATEGORY = '';

export interface AttachmentHandlers {
  attachments: Array<UploadDetail | UploadOut>;
  setAttachments: (value: Array<UploadDetail | UploadOut>) => void;
  uploadQueue: File[];
  setUploadQueue: (value: File[]) => void;
  attaching: boolean;
  setAttaching: (value: boolean) => void;
  handleAttach: (file: File) => Promise<void>;
  startNextInQueue: () => void;
  fileIcon: (name: string, mime: string | undefined) => string;
}

export function useAttachmentHandlers(): AttachmentHandlers {
  const [attachments, setAttachments] = useState<Array<UploadDetail | UploadOut>>([]);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [attaching, setAttaching] = useState<boolean>(false);

  // Small util to map mime to an icon (emoji to avoid extra deps)
  const fileIcon = useCallback((name: string, mime: string | undefined): string => {
    if (mime?.startsWith('image/')) return '🖼️';
    if (mime === 'application/pdf') return '📄';
    if (mime?.includes('word') || name.endsWith('.docx')) return '📝';
    if (name.endsWith('.md') || name.endsWith('.txt')) return '🗒️';
    if (name.endsWith('.csv')) return '📊';
    return '📎';
  }, []);

  const handleAttach = useCallback(async (file: File): Promise<void> => {
    if (attaching) {
      // Queue this file for later
      setUploadQueue((q) => [...q, file]);
      return;
    }
    try {
      setAttaching(true);
      const uploaded = await uploadFile(file);
      const detail = await getUpload(uploaded.upload_id);
      setAttachments((prev) => [...prev, detail]);
      toast.success(`Attached ${file.name}`);
    } catch (e: any) {
      toast.error(`Upload failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setAttaching(false);
      // Start next in queue if any
      setUploadQueue((q) => {
        if (q.length === 0) return q;
        const [next, ...rest] = q;
        // Kick off next upload
        void handleAttach(next);
        return rest;
      });
    }
  }, [attaching]);

  const startNextInQueue = useCallback((): void => {
    setUploadQueue((q) => {
      if (q.length === 0) return q;
      const [next, ...rest] = q;
      // Kick off next upload
      void handleAttach(next);
      return rest;
    });
  }, [handleAttach]);

  return {
    attachments,
    setAttachments,
    uploadQueue,
    setUploadQueue,
    attaching,
    setAttaching,
    handleAttach,
    startNextInQueue,
    fileIcon,
  };
}
