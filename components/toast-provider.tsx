'use client';

import * as React from 'react';
import { ToastProvider as Toast } from '@/components/ui/use-toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast>
      {children}
      <ToastViewport />
    </Toast>
  );
}

// Toast components
export * from '@/components/ui/use-toast';
