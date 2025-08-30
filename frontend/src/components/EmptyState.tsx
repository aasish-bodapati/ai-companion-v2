"use client";

import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, subtitle, action }: Props) {
  return (
    <div className="w-full border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center bg-white dark:bg-gray-800">
      <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">{title}</h3>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
