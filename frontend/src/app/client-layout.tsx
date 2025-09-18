'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';
import { ToastProvider } from '@/components/ui/toast';
import NavBar from '@/components/layout/NavBar';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/register'].includes(pathname);
  const isAppPage = !isAuthPage;
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
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
                richColors={false}
                visibleToasts={3}
                gap={8}
                offset={16}
                closeButton
                expand
                className="z-[9999]"
                toastOptions={{
                  duration: 3000,
                  className: 'dark:bg-gray-800 dark:text-white dark:border-gray-600 bg-white text-gray-900 border-gray-200',
                }}
              />
            </div>
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutContent>{children}</LayoutContent>;
}
