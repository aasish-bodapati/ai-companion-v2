'use client';

import { ReactNode } from 'react';

type AppLayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export default function AppLayout({ 
  children, 
  title = 'AI Companion',
  description = 'Your personal AI companion'
}: AppLayoutProps) {
  return (
    <main className="relative min-h-[calc(100vh-8rem)] py-0 px-0 w-full">
      {(title || description) && (
        <div className="w-full py-8">
          <div className="text-center px-4 sm:px-6 lg:px-8">
            {title && (
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      {/* Sitewide look: render children full-bleed without sticky card wrapper */}
      {children}
    </main>
  );
}
