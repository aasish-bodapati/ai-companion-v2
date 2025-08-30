"use client";

import { MemoryStatus } from '@/components/memory/MemoryStatus';

export default function OverviewTab() {
  return (
    <div className="space-y-6">
      <MemoryStatus />
    </div>
  );
}
