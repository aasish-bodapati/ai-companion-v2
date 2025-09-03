import { useState, useCallback } from 'react';
// Toast removed for Milestone 1 simplicity
// Action API removed for Milestone 1 simplicity
type ActionDescriptor = any;

export interface ActionHandlers {
  actionsByName: Record<string, ActionDescriptor>;
  permOpen: boolean;
  setPermOpen: (value: boolean) => void;
  permAction: { action: string; label: string; description?: string; scopes?: string[]; params?: Record<string, any> } | null;
  setPermAction: (value: any) => void;
  requestRun: (action: { name: string; title?: string; description?: string; permissions?: string[] }, params?: Record<string, any>) => void;
  runActionWithPolicy: (name: string, label: string, params?: Record<string, any>) => Promise<void>;
  toToastMessage: (v: any) => string;
}

export function useActionHandlers(): ActionHandlers {
  const [actionsByName, setActionsByName] = useState<Record<string, ActionDescriptor>>({});
  const [permOpen, setPermOpen] = useState<boolean>(false);
  const [permAction, setPermAction] = useState<{ action: string; label: string; description?: string; scopes?: string[]; params?: Record<string, any> } | null>(null);

  // Simplified for Milestone 1
  const toToastMessage = useCallback((v: any): string => 'Action failed', []);
  const requestRun = useCallback(() => {}, []);
  const runActionWithPolicy = useCallback(async () => {}, []);

  return {
    actionsByName,
    permOpen,
    setPermOpen,
    permAction,
    setPermAction,
    requestRun,
    runActionWithPolicy,
    toToastMessage,
  };
}