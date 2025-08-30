"use client";

import React, { useState, useEffect, useRef } from 'react';

type QuickAddModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; durationMinutes: number; description?: string; whenText?: string }) => void;
  initialTitle?: string;
};

export function QuickAddModal({ open, onClose, onCreate, initialTitle }: QuickAddModalProps) {
  const [title, setTitle] = useState<string>(initialTitle || '');
  const [duration, setDuration] = useState<number>(30);
  const [description, setDescription] = useState<string>('');
  const [whenText, setWhenText] = useState<string>('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = (document.activeElement as HTMLElement) || null;
      setTitle(initialTitle || '');
      setDuration(30);
      setDescription('');
      setWhenText('');
      // focus the title input on open
      setTimeout(() => {
        const el = containerRef.current?.querySelector<HTMLElement>('#qa-title');
        el?.focus();
      }, 0);
    }
  }, [open, initialTitle]);

  const handleClose = () => {
    onClose();
    const el = prevFocusRef.current;
    if (el && typeof el.focus === 'function') {
      setTimeout(() => el.focus(), 0);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Quick add event">
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
            const t = title.trim();
            if (!t) return;
            const d = Number.isFinite(duration) && duration > 0 ? duration : 30;
            onCreate({ title: t, durationMinutes: d, description: description.trim() || undefined, whenText: whenText.trim() || undefined });
            handleClose();
          }
        }}
      >
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick add event</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1" htmlFor="qa-title">Title</label>
            <input
              id="qa-title"
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Event title"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1" htmlFor="qa-when">When (smart)</label>
            <input
              id="qa-when"
              type="text"
              value={whenText}
              onChange={(e) => setWhenText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., tomorrow 1pm for 45m, or 2025-08-20 14:00"
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Hints: today/tomorrow, HH:MM, in 30m/2h, for 30m</p>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1" htmlFor="qa-duration">Duration (minutes)</label>
            <input
              id="qa-duration"
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => {
                const v = parseInt(e.target.value || '0', 10);
                setDuration(Number.isFinite(v) && v > 0 ? v : 30);
              }}
              className="w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1" htmlFor="qa-desc">Description (optional)</label>
            <textarea
              id="qa-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Notes..."
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
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
              const t = title.trim();
              if (!t) return;
              const d = Number.isFinite(duration) && duration > 0 ? duration : 30;
              onCreate({ title: t, durationMinutes: d, description: description.trim() || undefined, whenText: whenText.trim() || undefined });
              handleClose();
            }}
            className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
