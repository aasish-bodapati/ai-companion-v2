import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/60 dark:border-gray-700/60 mt-12">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} AI Companion. All rights reserved.
          </p>
          <div className="mt-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Built with Next.js, FastAPI, and Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
