'use client';

import React from 'react';
import { DataViewContainer } from '@/components/ui/data-view-container';
import { StatsGrid, StatItem } from '@/components/ui/stats-grid';
import { SearchAndFilter } from '@/components/ui/search-and-filter';
import { EmptyState } from '@/components/ui/empty-state';
import { useFitnessLogs } from '@/hooks/useFitnessLogs';
import { useFitnessLogsView } from '@/hooks/useFitnessLogsView';
import { useFitnessLogsCRUD } from '@/hooks/useFitnessLogsCRUD';
import { FitnessLogsViewControls } from './FitnessLogsViewControls';
import { FitnessLogsDayView } from './FitnessLogsDayView';
import { FitnessLogsMonthView } from './FitnessLogsMonthView';
import { FitnessLogsBulkDeleteDialog } from './FitnessLogsBulkDeleteDialog';
import { DynamicWorkoutLogger } from './DynamicWorkoutLogger';
import { 
  ClockIcon, 
  FireIcon, 
  TrophyIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import { formatDuration } from '@/utils/fitnessLogsUtils';

interface FitnessLogsViewProps {
  className?: string;
  refreshTrigger?: number;
}

export function FitnessLogsViewWithDataComponents({ className = '', refreshTrigger }: FitnessLogsViewProps) {
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

  // Convert stats to StatItem format for StatsGrid
  const statsItems: StatItem[] = [
    {
      id: 'totalWorkouts',
      label: 'Total Workouts',
      value: stats.totalWorkouts,
      icon: <ChartBarIcon className="h-8 w-8" />,
      color: 'blue',
      gradient: true,
      animated: true
    },
    {
      id: 'totalDuration',
      label: 'Total Duration',
      value: formatDuration(stats.totalDuration),
      icon: <ClockIcon className="h-8 w-8" />,
      color: 'green',
      gradient: true,
      animated: false
    },
    {
      id: 'totalCalories',
      label: 'Total Calories',
      value: stats.totalCalories,
      icon: <FireIcon className="h-8 w-8" />,
      color: 'orange',
      gradient: true,
      animated: true
    },
    {
      id: 'currentStreak',
      label: 'Current Streak',
      value: stats.currentStreak,
      unit: 'days',
      icon: <TrophyIcon className="h-8 w-8" />,
      color: 'purple',
      gradient: true,
      animated: true
    }
  ];

  // Search and filter configuration
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterValue, setFilterValue] = React.useState('all');

  const filterOptions = [
    { value: 'all', label: 'All Workouts' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search logic
  };

  const handleFilter = (filter: string) => {
    setFilterValue(filter);
    // TODO: Implement filter logic
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterValue('all');
  };

  // Empty state configuration
  const emptyStateConfig = {
    title: 'No Workouts Yet',
    description: 'Start your fitness journey by logging your first workout!',
    icon: <ChartBarIcon className="h-12 w-12 text-gray-400" />,
    action: {
      label: 'Add Workout',
      onClick: () => closeAddDialog()
    }
  };

  return (
    <DataViewContainer
      loading={loading}
      error={error}
      onRetry={refreshLogs}
      isEmpty={logs.length === 0}
      emptyComponent={<EmptyState {...emptyStateConfig} variant="card" />}
      className={`space-y-6 ${className}`}
      data-testid="fitness-logs-container"
    >
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

      {/* Search and Filter */}
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder="Search workouts..."
        filters={[
          {
            key: 'period',
            label: 'Period',
            value: filterValue,
            options: filterOptions,
            onValueChange: handleFilter
          }
        ]}
        onClearFilters={handleClearFilters}
        onAdd={() => closeAddDialog()}
        addLabel="Add Workout"
      />

      {/* Stats Grid */}
      <StatsGrid
        stats={statsItems}
        columns={4}
        loading={loading}
        data-testid="stats-grid"
      />

      {/* Main Content */}
      {viewMode === 'day' ? (
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
    </DataViewContainer>
  );
}
