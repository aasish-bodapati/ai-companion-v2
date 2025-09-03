'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Don't show navbar on auth pages
  if (['/login', '/register'].includes(pathname)) {
    return null;
  }

  return (
    <nav className="bg-purple-900/80 dark:bg-purple-950/80 backdrop-blur-sm border-b border-purple-700/60 dark:border-purple-800/60 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Navigation links */}
          <div className="hidden sm:flex space-x-8">
            {!isAuthenticated ? (
              <NavLink href="/" pathname={pathname}>
                Home
              </NavLink>
            ) : (
              <>
                <NavLink href="/chat" pathname={pathname}>
                  Chat
                </NavLink>
                <NavLink href="/test-memory" pathname={pathname}>
                  Test Memory
                </NavLink>
              </>
            )}
          </div>
          <div className="hidden sm:flex sm:items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center space-x-6">
                <Link
                  href="/profile"
                  className="text-sm font-medium text-purple-200 dark:text-purple-300 hover:text-white dark:hover:text-purple-100 transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-purple-600 dark:border-purple-700 text-purple-100 dark:text-purple-200 hover:bg-purple-800 dark:hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-purple-200 dark:text-purple-300 hover:text-white dark:hover:text-purple-100 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-transparent text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-purple-200 dark:text-purple-300 hover:text-white dark:hover:text-purple-100 hover:bg-purple-800 dark:hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {!isAuthenticated ? (
              <MobileNavLink href="/" pathname={pathname}>
                Home
              </MobileNavLink>
            ) : (
              <>
                <MobileNavLink href="/today" pathname={pathname}>
                  Today
                </MobileNavLink>
                <MobileNavLink href="/chat" pathname={pathname}>
                  Chat
                </MobileNavLink>
                <MobileNavLink href="/memories" pathname={pathname}>
                  Memories
                </MobileNavLink>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-purple-700/60 dark:border-purple-800/60">
            <div className="px-4 mb-3">
              <ThemeToggle />
            </div>
            {isAuthenticated ? (
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                    <span className="text-purple-300 font-medium">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-purple-100">
                    {user?.email}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    window.location.href = '/login';
                  }}
                  className="ml-auto flex-shrink-0 bg-purple-800/50 p-1 rounded-full text-purple-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <span className="sr-only">Sign out</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-1">
                <Link
                  href="/login"
                  className="block px-4 py-2 text-base font-medium text-purple-200 dark:text-purple-300 hover:text-white dark:hover:text-purple-100 hover:bg-purple-800 dark:hover:bg-purple-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 text-base font-medium text-purple-200 dark:text-purple-300 hover:text-white dark:hover:text-purple-100 hover:bg-purple-800 dark:hover:bg-purple-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
}) {
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      data-testid={`nav-link-${href.replace('/', '')}`}
      className={`${
        isActive
          ? 'border-purple-300 dark:border-purple-400 text-white dark:text-purple-100'
          : 'border-transparent text-purple-200 dark:text-purple-300 hover:border-purple-300 dark:hover:border-purple-400 hover:text-white dark:hover:text-purple-100'
      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
}) {
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      data-testid={`mobile-nav-link-${href.replace('/', '')}`}
      className={`${
        isActive
          ? 'bg-purple-600/20 border-purple-400 text-purple-200'
          : 'border-transparent text-purple-300 hover:bg-purple-800/50 hover:border-purple-500 hover:text-purple-100'
      } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
    >
      {children}
    </Link>
  );
}
