'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';
import NavBar from '@/components/layout/NavBar';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/register'].includes(pathname);
  const isAppPage = !isAuthPage;
  // Create a single QueryClient per app lifetime
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen flex flex-col">
            {isAppPage && <NavBar />}
            <main className={isAppPage ? 'flex-1 py-0 px-0 w-full' : 'flex-1'}>
              {/* Sitewide look: always render full-bleed without inner width constraints */}
              {children}
            </main>
            {/* Footer removed globally per user request */}
            {/* Configure Toaster to show multiple concurrent notifications without overlap */}
            <Toaster
              position="top-right"
              richColors
              visibleToasts={6}
              gap={12}
              offset={20}
              closeButton
              expand
              className="z-[9999]"
              toastOptions={{
                duration: 3500,
              }}
            />
          </div>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
