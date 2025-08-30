import React from 'react';
import CapabilitiesPanel from '@/features/actions/CapabilitiesPanel';
import ActionPermissionPrompt from '@/features/actions/ActionPermissionPrompt';
import { ActionHandlers } from '../hooks/useActionHandlers';

interface ActionModalsProps {
  actionHandlers: ActionHandlers;
}

export function ActionModals({ actionHandlers }: ActionModalsProps) {
  return (
    <>
      {/* Action Permission Prompt */}
      {actionHandlers.permOpen && (
        <ActionPermissionPrompt
          open={actionHandlers.permOpen}
          action={actionHandlers.permAction?.action || ''}
          label={actionHandlers.permAction?.label || ''}
          description={actionHandlers.permAction?.description}
          scopes={actionHandlers.permAction?.scopes}
          onCancel={() => actionHandlers.setPermOpen(false)}
          onConfirm={() => {
            // Handle action execution
            actionHandlers.setPermOpen(false);
          }}
        />
      )}
    </>
  );
}
