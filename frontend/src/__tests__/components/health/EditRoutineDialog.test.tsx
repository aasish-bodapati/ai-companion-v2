import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditRoutineDialog } from '@/features/health/components/EditRoutineDialog';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';
import { toast } from 'sonner';

// Mock the API
jest.mock('@/lib/simpleRoutineApi');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRoutine = {
  id: '1',
  name: 'Beginner Full Body',
  description: 'A beginner-friendly full body workout',
  difficulty: 'beginner',
  duration_weeks: 4,
  tags: ['weightlifting', 'beginner'],
  is_template: true,
  created_by: 'system',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_progress: null,
  workout_schedule: [
    {
      day: 'Monday',
      workout_name: 'Upper Body',
      exercises: [
        {
          exercise_name: 'Push-ups',
          sets: 3,
          reps: '10-15',
          weight_notes: 'bodyweight',
          rest_time: '60-90 seconds',
          notes: 'Keep core tight'
        },
        {
          exercise_name: 'Dumbbell Rows',
          sets: 3,
          reps: '10-12',
          weight_notes: 'light weight',
          rest_time: '60-90 seconds',
          notes: 'Control the weight'
        }
      ]
    },
    {
      day: 'Wednesday',
      workout_name: 'Lower Body',
      exercises: [
        {
          exercise_name: 'Bodyweight Squats',
          sets: 3,
          reps: '12-15',
          weight_notes: 'bodyweight',
          rest_time: '60-90 seconds',
          notes: 'Keep knees behind toes'
        }
      ]
    }
  ],
  total_workouts_per_week: 2
};

describe('EditRoutineDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnRoutineUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (simpleRoutineApi.updateRoutineWithWorkoutPlan as jest.Mock).mockResolvedValue({});
  });

  it('renders edit dialog with routine data', () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    expect(screen.getByText('Edit Routine: Beginner Full Body')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Beginner Full Body')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Wednesday')).toBeInTheDocument();
  });

  it('displays existing workout data', () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    // Check Monday workouts
    expect(screen.getByText('Push-ups')).toBeInTheDocument();
    expect(screen.getByText('Dumbbell Rows')).toBeInTheDocument();
    
    // Check Wednesday workouts
    expect(screen.getByText('Bodyweight Squats')).toBeInTheDocument();
  });

  it('allows editing routine name', () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    const nameInput = screen.getByDisplayValue('Beginner Full Body');
    fireEvent.change(nameInput, { target: { value: 'Advanced Full Body' } });

    expect(nameInput).toHaveValue('Advanced Full Body');
  });

  it('allows selecting activity types', () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    // Weightlifting should be checked by default
    const weightliftingCheckbox = screen.getByLabelText('Weightlifting');
    expect(weightliftingCheckbox).toBeChecked();

    // Check cardio
    const cardioCheckbox = screen.getByLabelText('Cardio');
    fireEvent.click(cardioCheckbox);
    expect(cardioCheckbox).toBeChecked();
  });

  it('allows adding new workouts to a day', () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    // Add workout to Tuesday (which should be empty)
    const tuesdayAddButton = screen.getByText('Tuesday').closest('.day-card')?.querySelector('button');
    if (tuesdayAddButton) {
      fireEvent.click(tuesdayAddButton);
    }

    // Should show new workout form
    expect(screen.getByText('Activity Type')).toBeInTheDocument();
  });

  it('allows editing existing workout details', () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    // Find and click edit button for Push-ups
    const editButton = screen.getByLabelText('Edit Push-ups');
    fireEvent.click(editButton);

    // Should show edit form with current values
    expect(screen.getByDisplayValue('Push-ups')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // Sets
    expect(screen.getByDisplayValue('10-15')).toBeInTheDocument(); // Reps
  });

  it('allows deleting workouts', () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    // Find and click delete button for Push-ups
    const deleteButton = screen.getByLabelText('Delete Push-ups');
    fireEvent.click(deleteButton);

    // Should remove the workout from display
    expect(screen.queryByText('Push-ups')).not.toBeInTheDocument();
  });

  it('validates required fields before saving', async () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    // Clear the routine name
    const nameInput = screen.getByDisplayValue('Beginner Full Body');
    fireEvent.change(nameInput, { target: { value: '' } });

    // Try to save
    const saveButton = screen.getByText('Save Routine');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter a routine name');
    });
  });

  it('validates activity types selection', async () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    // Uncheck all activity types
    const weightliftingCheckbox = screen.getByLabelText('Weightlifting');
    fireEvent.click(weightliftingCheckbox);

    // Try to save
    const saveButton = screen.getByText('Save Routine');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please select at least one activity type');
    });
  });

  it('validates workout count', async () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    // Delete all workouts
    const deleteButtons = screen.getAllByLabelText(/Delete/);
    deleteButtons.forEach(button => fireEvent.click(button));

    // Try to save
    const saveButton = screen.getByText('Save Routine');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please add at least one workout');
    });
  });

  it('saves routine successfully', async () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    // Change routine name
    const nameInput = screen.getByDisplayValue('Beginner Full Body');
    fireEvent.change(nameInput, { target: { value: 'Updated Routine' } });

    // Save
    const saveButton = screen.getByText('Save Routine');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(simpleRoutineApi.updateRoutineWithWorkoutPlan).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          routine_data: expect.objectContaining({
            name: 'Updated Routine'
          })
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Routine updated successfully!');
      expect(mockOnRoutineUpdated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles save errors gracefully', async () => {
    (simpleRoutineApi.updateRoutineWithWorkoutPlan as jest.Mock).mockRejectedValue(new Error('Save failed'));

    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    const saveButton = screen.getByText('Save Routine');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update routine. Please try again.');
    });
  });

  it('closes dialog when close button is clicked', () => {
    render(
      <EditRoutineDialog
        routine={mockRoutine}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not render when routine is null', () => {
    render(
      <EditRoutineDialog
        routine={null}
        isOpen={true}
        onClose={mockOnClose}
        onRoutineUpdated={mockOnRoutineUpdated}
      />
    );

    expect(screen.queryByText('Edit Routine:')).not.toBeInTheDocument();
  });
});
