'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
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
  const isOnboarding = pathname === '/onboarding';
  const isAppPage = !isAuthPage && !isOnboarding;
  // Create a single QueryClient per app lifetime
  const [queryClient] = useState(() => new QueryClient());

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
