import React from 'react';

export type ActionPermissionPromptProps = {
  open: boolean;
  label: string;
  action: string;
  description?: string;
  scopes?: string[];
  onCancel: () => void;
  onConfirm: () => void;
};

const ActionPermissionPrompt: React.FC<ActionPermissionPromptProps> = ({ open, label, action, description, scopes, onCancel, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-4">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Confirm action</div>
        <div className="mt-1 text-xs text-gray-500">{label}</div>
        <div className="mt-2 text-sm">
          <div className="text-gray-700 dark:text-gray-200"><span className="font-mono text-[12px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">{action}</span></div>
          {description && <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">{description}</div>}
          {Array.isArray(scopes) && scopes.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Requested permissions</div>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                {scopes.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="text-[12px] px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            data-testid="permission-cancel"
            onClick={onCancel}
          >Cancel</button>
          <button
            type="button"
            className="text-[12px] px-3 py-1.5 rounded-lg border border-indigo-300 text-white bg-indigo-600 hover:bg-indigo-700"
            data-testid="permission-confirm"
            onClick={onConfirm}
          >Allow</button>
        </div>
      </div>
    </div>
  );
};

export default ActionPermissionPrompt;
