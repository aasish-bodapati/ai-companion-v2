'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  showBackButton?: boolean;
};

export default function AuthLayout({ 
  children, 
  title, 
  subtitle,
  showBackButton = false 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.05)_0,transparent_70%)] [background-size:30px_30px]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 to-purple-100/20 dark:from-indigo-900/10 dark:to-purple-900/10" />
      </div>
      
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto">
            <Link href="/" className="inline-flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span className="text-xl font-bold">AI Companion</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-grow flex items-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-6xl mx-auto bg-white/60 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-indigo-100/60 dark:border-indigo-900/30">
            <div className="flex flex-col md:flex-row min-h-[600px]">
              {/* Left Side - Branding */}
              <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-600 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-overlay blur-3xl" />
                
                <div className="relative z-10 max-w-md mx-auto text-white">
                  <h2 className="text-4xl font-bold mb-6 leading-tight">Welcome to AI Companion</h2>
                  <p className="text-lg text-indigo-100 mb-8">
                    Join thousands of users who are already enhancing their productivity with our intelligent assistant.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <svg className="h-6 w-6 text-green-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Personalized AI assistance</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-6 w-6 text-green-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>24/7 availability</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-6 w-6 text-green-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Secure and private</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center bg-white/70 dark:bg-gray-900/40 backdrop-blur-md">
                <div className="w-full max-w-md">
                  {showBackButton && (
                    <button 
                      onClick={() => window.history.back()}
                      className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back
                    </button>
                  )}
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{subtitle}</p>
                  </div>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                &copy; {new Date().getFullYear()} AI Companion. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                  <span className="text-sm">Terms</span>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                  <span className="text-sm">Privacy</span>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                  <span className="text-sm">Contact</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
