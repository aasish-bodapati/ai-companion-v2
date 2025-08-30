import React, { useState, useEffect } from 'react';
import { UPLOAD_CATEGORIES } from '@/features/uploads/constants';

export interface UploadPreviewModalProps {
  isOpen: boolean;
  filename: string;
  uploadId: string;
  initialPreview?: string | null;
  defaultCategory: string;
  defaultImportance: number;
  onCancel: () => void;
  onConfirm: (opts: { category: string; importance: number }) => Promise<void> | void;
}

export function UploadPreviewModal({
  isOpen,
  filename,
  uploadId,
  initialPreview,
  defaultCategory,
  defaultImportance,
  onCancel,
  onConfirm,
}: UploadPreviewModalProps) {
  const [category, setCategory] = useState<string>(defaultCategory);
  const [importance, setImportance] = useState<number>(defaultImportance);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
      setImportance(defaultImportance);
    }
  }, [isOpen, defaultCategory, defaultImportance]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-base font-semibold">Add to Memory</h3>
          <button className="text-sm text-gray-500 hover:text-gray-700" onClick={onCancel}>Close</button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Filename</div>
              <div className="text-sm font-medium break-all">{filename}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Preview (first 2k chars)</div>
              <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded max-h-64 overflow-auto border">
                {initialPreview || 'No preview available'}
              </pre>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800"
              >
                {UPLOAD_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Importance ({importance.toFixed(2)})</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={importance}
                onChange={(e) => setImportance(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded border text-sm"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setSubmitting(true);
                    await onConfirm({ category, importance });
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Adding…' : 'Add to Memory and Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
