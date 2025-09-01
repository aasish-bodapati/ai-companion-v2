import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Extends all standard HTML input attributes
  className?: string;
}

export function Input({ className = '', ...props }: InputProps) {
  const baseClasses = "flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50";
  
  return (
    <input
      className={`${baseClasses} ${className}`.trim()}
      {...props}
    />
  );
}
