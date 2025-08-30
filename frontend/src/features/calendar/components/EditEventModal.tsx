"use client";

import React, { useEffect, useRef, useState } from 'react';

type EditEventModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onUpdate: (data: { title: string; description?: string }) => void;
  onDelete: () => void;
};

export function EditEventModal({ open, title, description, onClose, onUpdate, onDelete }: EditEventModalProps) {
  const [newTitle, setNewTitle] = useState<string>(title);
  const [newDesc, setNewDesc] = useState<string>(description || '');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = (document.activeElement as HTMLElement) || null;
      setNewTitle(title);
      setNewDesc(description || '');
      // focus the title input on open
      setTimeout(() => {
        const el = containerRef.current?.querySelector<HTMLElement>('#ee-title');
        el?.focus();
      }, 0);
    }
  }, [open, title, description]);

  const handleClose = () => {
    onClose();
    const el = prevFocusRef.current;
    if (el && typeof el.focus === 'function') {
      setTimeout(() => el.focus(), 0);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Edit event">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div
        className="relative w-full max-w-md mx-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-4"
        ref={containerRef}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.stopPropagation(); handleClose(); }
          if (e.key === 'Tab') {
            const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusables || focusables.length === 0) return;
            const list = Array.from(focusables).filter((n) => n.offsetParent !== null);
            if (list.length === 0) return;
            const first = list[0];
            const last = list[list.length - 1];
            const active = document.activeElement as HTMLElement | null;
            if (e.shiftKey) {
              if (active === first || !containerRef.current?.contains(active)) {
                e.preventDefault();
                last.focus();
              }
            } else {
              if (active === last || !containerRef.current?.contains(active)) {
                e.preventDefault();
                first.focus();
              }
            }
          }
          if (e.key === 'Enter') {
            const t = newTitle.trim();
            if (!t) return;
            onUpdate({ title: t, description: newDesc.trim() || undefined });
            handleClose();
          }
        }}
      >
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Edit event</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1" htmlFor="ee-title">Title</label>
            <input
              id="ee-title"
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Event title"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1" htmlFor="ee-desc">Description (optional)</label>
            <textarea
              id="ee-desc"
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Notes..."
            />
          </div>
        </div>
        <div className="mt-4 flex justify-between gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const t = newTitle.trim();
                if (!t) return;
                onUpdate({ title: t, description: newDesc.trim() || undefined });
                handleClose();
              }}
              className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
