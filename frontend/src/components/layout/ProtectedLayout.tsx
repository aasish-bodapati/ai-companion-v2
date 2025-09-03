'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
