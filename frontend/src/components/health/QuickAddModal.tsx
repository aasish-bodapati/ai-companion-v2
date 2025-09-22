'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlusIcon } from '@heroicons/react/24/outline';
import { UnifiedLogger } from './UnifiedLogger';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  return (
    <UnifiedLogger
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}