import { useState, useCallback } from 'react';
import { WorkoutLog, CreateWorkoutLogData, UpdateWorkoutLogData } from '@/services/fitnessLogsService';

export interface UseFitnessLogsCRUDOptions {
  onLogCreated?: (log: WorkoutLog) => void;
  onLogUpdated?: (log: WorkoutLog) => void;
  onLogDeleted?: (logId: string) => void;
  onLogsDeleted?: (logIds: string[]) => void;
}

export interface UseFitnessLogsCRUDReturn {
  // CRUD state
  editingLog: WorkoutLog | null;
  isEditDialogOpen: boolean;
  isAddDialogOpen: boolean;
  editFormData: {
    activity_name: string;
    duration_minutes: number;
    calories_burned: number;
    notes: string;
    activity_type: string;
  };
  
  // Bulk operations state
  selectedLogs: Set<string>;
  isBulkDeleteMode: boolean;
  isDeleting: boolean;
  showDeleteConfirm: boolean;
  
  // CRUD actions
  handleEditLog: (log: WorkoutLog) => void;
  handleDeleteLog: (logId: string, onDelete: (logId: string) => Promise<boolean>) => Promise<void>;
  handleUpdateLog: (onUpdate: (logId: string, data: UpdateWorkoutLogData) => Promise<WorkoutLog | null>) => Promise<void>;
  handleAddLog: (onCreate: (data: CreateWorkoutLogData) => Promise<WorkoutLog | null>) => Promise<void>;
  closeEditDialog: () => void;
  closeAddDialog: () => void;
  resetFormData: () => void;
  
  // Bulk operations actions
  toggleLogSelection: (logId: string) => void;
  selectAllLogs: (logs: WorkoutLog[]) => void;
  clearSelection: () => void;
  handleBulkDelete: (onDeleteMultiple: (logIds: string[]) => Promise<boolean>) => Promise<void>;
  confirmBulkDelete: (onDeleteMultiple: (logIds: string[]) => Promise<boolean>) => Promise<void>;
  cancelBulkDelete: () => void;
  toggleBulkDeleteMode: () => void;
  
  // Form helpers
  updateFormData: (field: string, value: any) => void;
  setFormData: (data: Partial<{
    activity_name: string;
    duration_minutes: number;
    calories_burned: number;
    notes: string;
    activity_type: string;
  }>) => void;
}

export function useFitnessLogsCRUD(options: UseFitnessLogsCRUDOptions = {}): UseFitnessLogsCRUDReturn {
  const { onLogCreated, onLogUpdated, onLogDeleted, onLogsDeleted } = options;
  
  // CRUD state
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    activity_name: '',
    duration_minutes: 0,
    calories_burned: 0,
    notes: '',
    activity_type: 'weightlifting' as string
  });

  // Bulk operations state
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Handle editing a log
   */
  const handleEditLog = useCallback((log: WorkoutLog) => {
    setEditingLog(log);
    setEditFormData({
      activity_name: log.workout_name || log.routine_name || '',
      duration_minutes: log.duration_minutes || 0,
      calories_burned: log.calories_burned || 0,
      notes: log.notes || '',
      activity_type: 'weightlifting' // Default for now
    });
    setIsEditDialogOpen(true);
  }, []);

  /**
   * Handle deleting a single log
   */
  const handleDeleteLog = useCallback(async (logId: string, onDelete: (logId: string) => Promise<boolean>) => {
    if (!confirm('Are you sure you want to delete this workout log?')) return;
    
    const success = await onDelete(logId);
    if (success) {
      onLogDeleted?.(logId);
    }
  }, [onLogDeleted]);

  /**
   * Handle updating a log
   */
  const handleUpdateLog = useCallback(async (onUpdate: (logId: string, data: UpdateWorkoutLogData) => Promise<WorkoutLog | null>) => {
    if (!editingLog) return;

    const updateData = {
      activity_name: editFormData.activity_name,
      duration_minutes: editFormData.duration_minutes,
      calories_burned: editFormData.calories_burned,
      notes: editFormData.notes,
      activity_type: editFormData.activity_type
    };

    const updatedLog = await onUpdate(editingLog.id, updateData);
    if (updatedLog) {
      onLogUpdated?.(updatedLog);
      closeEditDialog();
    }
  }, [editingLog, editFormData, onLogUpdated]);

  /**
   * Handle adding a new log
   */
  const handleAddLog = useCallback(async (onCreate: (data: CreateWorkoutLogData) => Promise<WorkoutLog | null>) => {
    const newLogData = {
      activity_name: editFormData.activity_name,
      duration_minutes: editFormData.duration_minutes,
      calories_burned: editFormData.calories_burned,
      notes: editFormData.notes,
      activity_type: editFormData.activity_type,
      activity_date: new Date().toISOString()
    };

    const newLog = await onCreate(newLogData);
    if (newLog) {
      onLogCreated?.(newLog);
      closeAddDialog();
    }
  }, [editFormData, onLogCreated]);

  /**
   * Close edit dialog
   */
  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingLog(null);
    resetFormData();
  }, []);

  /**
   * Close add dialog
   */
  const closeAddDialog = useCallback(() => {
    setIsAddDialogOpen(false);
    resetFormData();
  }, []);

  /**
   * Reset form data to defaults
   */
  const resetFormData = useCallback(() => {
    setEditFormData({
      activity_name: '',
      duration_minutes: 0,
      calories_burned: 0,
      notes: '',
      activity_type: 'weightlifting'
    });
  }, []);

  /**
   * Toggle selection of a log for bulk operations
   */
  const toggleLogSelection = useCallback((logId: string) => {
    setSelectedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  }, []);

  /**
   * Select all logs for bulk operations
   */
  const selectAllLogs = useCallback((logs: WorkoutLog[]) => {
    setSelectedLogs(new Set(logs.map(log => log.id)));
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedLogs(new Set());
  }, []);

  /**
   * Handle bulk delete initiation
   */
  const handleBulkDelete = useCallback(async (onDeleteMultiple: (logIds: string[]) => Promise<boolean>) => {
    if (selectedLogs.size === 0) return;
    setShowDeleteConfirm(true);
  }, [selectedLogs.size]);

  /**
   * Confirm bulk delete
   */
  const confirmBulkDelete = useCallback(async (onDeleteMultiple: (logIds: string[]) => Promise<boolean>) => {
    const logsToDelete = selectedLogs.size;
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    
    const logIds = Array.from(selectedLogs);
    const success = await onDeleteMultiple(logIds);
    
    if (success) {
      onLogsDeleted?.(logIds);
      setSelectedLogs(new Set());
      setIsBulkDeleteMode(false);
    }
    
    setIsDeleting(false);
  }, [selectedLogs, onLogsDeleted]);

  /**
   * Cancel bulk delete
   */
  const cancelBulkDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  /**
   * Toggle bulk delete mode
   */
  const toggleBulkDeleteMode = useCallback(() => {
    setIsBulkDeleteMode(!isBulkDeleteMode);
    if (isBulkDeleteMode) {
      setSelectedLogs(new Set());
    }
  }, [isBulkDeleteMode]);

  /**
   * Update a specific form field
   */
  const updateFormData = useCallback((field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * Set form data (for bulk updates)
   */
  const setFormData = useCallback((data: Partial<typeof editFormData>) => {
    setEditFormData(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  return {
    // CRUD state
    editingLog,
    isEditDialogOpen,
    isAddDialogOpen,
    editFormData,
    
    // Bulk operations state
    selectedLogs,
    isBulkDeleteMode,
    isDeleting,
    showDeleteConfirm,
    
    // CRUD actions
    handleEditLog,
    handleDeleteLog,
    handleUpdateLog,
    handleAddLog,
    closeEditDialog,
    closeAddDialog,
    resetFormData,
    
    // Bulk operations actions
    toggleLogSelection,
    selectAllLogs,
    clearSelection,
    handleBulkDelete,
    confirmBulkDelete,
    cancelBulkDelete,
    toggleBulkDeleteMode,
    
    // Form helpers
    updateFormData,
    setFormData
  };
}
