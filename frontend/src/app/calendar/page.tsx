"use client";

import CalendarView from '@/features/calendar/CalendarView';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">Calendar</h1>
        <CalendarView />
      </div>
    </ProtectedRoute>
  );
}
