import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@heroicons/react/24/outline';

interface FitnessLogsBulkDeleteDialogProps {
  isOpen: boolean;
  selectedCount: number;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FitnessLogsBulkDeleteDialog({
  isOpen,
  selectedCount,
  isDeleting,
  onConfirm,
  onCancel
}: FitnessLogsBulkDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrashIcon className="h-5 w-5 text-red-600" />
            Confirm Bulk Delete
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{selectedCount}</strong> workout log{selectedCount !== 1 ? 's' : ''}?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            This action cannot be undone.
          </p>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                Delete {selectedCount} Log{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
