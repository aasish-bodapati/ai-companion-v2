import React from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  kind?: ToastKind;
  onClose?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function Toast({ message, kind = 'info', onClose, actionLabel, onAction }: ToastProps) {
  const color = kind === 'success' ? 'bg-green-600' : kind === 'error' ? 'bg-red-600' : 'bg-gray-900';
  return (
    <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-md text-sm shadow text-white ${color}`}>
      <div className="flex items-center gap-3">
        <span>{message}</span>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="ml-2 inline-flex items-center justify-center rounded bg-white/10 px-2 py-1 hover:bg-white/20 focus:outline-none"
          >
            {actionLabel}
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 inline-flex items-center justify-center rounded hover:opacity-80 focus:outline-none"
            aria-label="Close toast"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

type ToastState = { message: string; kind: ToastKind; actionLabel?: string; onAction?: () => void } | null;

export function useToast() {
  const [toast, setToast] = React.useState<ToastState>(null);
  const show = (message: string, kind: ToastKind = 'info', action?: { label: string; onAction: () => void }) => {
    setToast({ message, kind, actionLabel: action?.label, onAction: action?.onAction });
    window.setTimeout(() => setToast(null), 3000);
  };
  return { toast, show, hide: () => setToast(null) };
}
