'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useFitnessLogs } from '@/hooks/useFitnessLogs';
import { useFitnessLogsView } from '@/hooks/useFitnessLogsView';
import { useFitnessLogsCRUD } from '@/hooks/useFitnessLogsCRUD';
import { FitnessLogsStats } from './FitnessLogsStats';
import { FitnessLogsViewControls } from './FitnessLogsViewControls';
import { FitnessLogsDayView } from './FitnessLogsDayView';
import { FitnessLogsMonthView } from './FitnessLogsMonthView';
import { FitnessLogsEmptyState } from './FitnessLogsEmptyState';
import { FitnessLogsErrorDisplay } from './FitnessLogsErrorDisplay';
import { FitnessLogsLoadingState } from './FitnessLogsLoadingState';
import { FitnessLogsBulkDeleteDialog } from './FitnessLogsBulkDeleteDialog';
import { DynamicWorkoutLogger } from './DynamicWorkoutLogger';

interface FitnessLogsViewProps {
  className?: string;
  refreshTrigger?: number;
}

export function FitnessLogsViewRefactored({ className = '', refreshTrigger }: FitnessLogsViewProps) {
  // Data management
  const {
    logs,
    stats,
    loading,
    error,
    createLog,
    updateLog,
    deleteLog,
    deleteMultipleLogs,
    setError,
    refreshLogs
  } = useFitnessLogs({ refreshTrigger, autoLoad: true });

  // View state management
  const {
    viewMode,
    currentDay,
    currentMonth,
    expandedDates,
    setViewMode,
    navigateDay,
    navigateMonth,
    setCurrentDay,
    setCurrentMonth,
    toggleDateExpansion,
    goToToday,
    getLogsForDate,
    getLogsForCurrentDay,
    getDateStats,
    getCurrentDayStats,
    getCalendarDays
  } = useFitnessLogsView();

  // CRUD operations
  const {
    editingLog,
    isEditDialogOpen,
    isAddDialogOpen,
    editFormData,
    selectedLogs,
    isBulkDeleteMode,
    isDeleting,
    showDeleteConfirm,
    handleEditLog,
    handleDeleteLog,
    handleUpdateLog,
    handleAddLog,
    closeEditDialog,
    closeAddDialog,
    toggleLogSelection,
    selectAllLogs,
    clearSelection,
    handleBulkDelete,
    confirmBulkDelete,
    cancelBulkDelete,
    toggleBulkDeleteMode
  } = useFitnessLogsCRUD({
    onLogCreated: () => refreshLogs(),
    onLogUpdated: () => refreshLogs(),
    onLogDeleted: () => refreshLogs(),
    onLogsDeleted: () => refreshLogs()
  });

  // Get current day logs and stats
  const currentDayLogs = getLogsForCurrentDay(logs);
  const currentDayStats = getCurrentDayStats(logs);

  // Handle CRUD operations with proper callbacks
  const handleDeleteLogWithCallback = async (logId: string) => {
    await handleDeleteLog(logId, deleteLog);
  };

  const handleUpdateLogWithCallback = async () => {
    await handleUpdateLog(updateLog);
  };

  const handleAddLogWithCallback = async () => {
    await handleAddLog(createLog);
  };

  const handleBulkDeleteWithCallback = async () => {
    await handleBulkDelete(deleteMultipleLogs);
  };

  const handleConfirmBulkDeleteWithCallback = async () => {
    await confirmBulkDelete(deleteMultipleLogs);
  };

  // Handle bulk operations
  const handleSelectAllLogs = () => {
    const logsToSelect = viewMode === 'day' ? currentDayLogs : logs;
    selectAllLogs(logsToSelect);
  };

  // Show loading state
  if (loading) {
    return <FitnessLogsLoadingState viewMode={viewMode} className={className} />;
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Error Display */}
        {error && (
          <FitnessLogsErrorDisplay 
            error={error} 
            onRetry={refreshLogs}
          />
        )}

        {/* View Controls */}
        <FitnessLogsViewControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddWorkout={() => closeAddDialog()}
          onBulkDelete={handleBulkDeleteWithCallback}
          onToggleBulkDelete={toggleBulkDeleteMode}
          onSelectAll={handleSelectAllLogs}
          onClearSelection={clearSelection}
          onNavigateDay={navigateDay}
          onNavigateMonth={navigateMonth}
          onGoToToday={goToToday}
          currentDay={currentDay}
          currentMonth={currentMonth}
          isBulkDeleteMode={isBulkDeleteMode}
          selectedCount={selectedLogs.size}
          isDeleting={isDeleting}
        />

        {/* Stats */}
        <FitnessLogsStats 
          stats={stats} 
          loading={loading}
        />

        {/* Main Content */}
        {logs.length === 0 ? (
          <FitnessLogsEmptyState 
            onAddWorkout={() => closeAddDialog()}
          />
        ) : viewMode === 'day' ? (
          <FitnessLogsDayView
            logs={currentDayLogs}
            currentDay={currentDay}
            dayStats={currentDayStats}
            isBulkDeleteMode={isBulkDeleteMode}
            selectedLogs={selectedLogs}
            onEditLog={handleEditLog}
            onDeleteLog={handleDeleteLogWithCallback}
            onToggleLogSelection={toggleLogSelection}
            onAddWorkout={() => closeAddDialog()}
          />
        ) : (
          <FitnessLogsMonthView
            calendarDays={getCalendarDays()}
            currentMonth={currentMonth}
            logs={logs}
            expandedDates={expandedDates}
            isBulkDeleteMode={isBulkDeleteMode}
            selectedLogs={selectedLogs}
            onToggleDateExpansion={toggleDateExpansion}
            onEditLog={handleEditLog}
            onDeleteLog={handleDeleteLogWithCallback}
            onToggleLogSelection={toggleLogSelection}
            getLogsForDate={(date) => getLogsForDate(date, logs)}
            getDateStats={(date) => getDateStats(date, logs)}
          />
        )}

        {/* Bulk Delete Confirmation Dialog */}
        <FitnessLogsBulkDeleteDialog
          isOpen={showDeleteConfirm}
          selectedCount={selectedLogs.size}
          isDeleting={isDeleting}
          onConfirm={handleConfirmBulkDeleteWithCallback}
          onCancel={cancelBulkDelete}
        />

        {/* Add/Edit Workout Dialog */}
        <DynamicWorkoutLogger 
          isOpen={isAddDialogOpen || isEditDialogOpen}
          onClose={() => {
            closeAddDialog();
            closeEditDialog();
          }}
          onSuccess={() => {
            closeAddDialog();
            closeEditDialog();
            refreshLogs();
          }}
          initialData={editingLog ? {
            workout_name: editingLog.workout_name || editingLog.routine_name || '',
            duration_minutes: editingLog.duration_minutes || 0,
            calories_burned: editingLog.calories_burned || 0,
            notes: editingLog.notes || '',
            exercises: editingLog.exercises || []
          } : undefined}
        />
      </div>
    </ErrorBoundary>
  );
}
