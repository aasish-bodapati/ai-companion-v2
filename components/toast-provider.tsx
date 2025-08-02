'use client';

import * as React from 'react';
import { Toaster } from '@/components/ui/toaster';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
export * from '@/components/ui/use-toast';
