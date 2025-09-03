import React from 'react';
// Action components removed for Milestone 1 simplicity
const CapabilitiesPanel = () => null;
const ActionPermissionPrompt = () => null;
import { ActionHandlers } from '../hooks/useActionHandlers';

interface ActionModalsProps {
  actionHandlers: ActionHandlers;
}

export function ActionModals({ actionHandlers }: ActionModalsProps) {
  return (
    <>
      {/* Action Permission Prompt removed for Milestone 1 simplicity */}
    </>
  );
}
