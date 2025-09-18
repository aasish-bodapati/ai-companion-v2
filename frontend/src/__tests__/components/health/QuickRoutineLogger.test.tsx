import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickRoutineLogger } from '@/components/health/QuickRoutineLogger';
import api from '@/lib/api';
import { toast } from 'sonner';

// Mock the APIs
jest.mock('@/lib/api');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockTodayRoutine = {
  fitness: [
    {
      id: '1',
      name: 'Push-ups',
      type: 'workout',
      completed: false,
      time: '09:00',
      details: {
        sets: 3,
        reps: 10,
        weight: 0
      }
    },
    {
      id: '2',
      name: 'Squats',
      type: 'workout',
      completed: false,
      time: '09:15',
      details: {
        sets: 3,
        reps: 15,
        weight: 0
      }
    }
  ],
  nutrition: [
    {
      id: '3',
      name: 'Breakfast',
      type: 'meal',
      completed: false,
      time: '08:00',
      details: {
        calories: 400
      }
    },
    {
      id: '4',
      name: 'Lunch',
      type: 'meal',
      completed: false,
      time: '12:30',
      details: {
        calories: 600
      }
    }
  ]
};

describe('QuickRoutineLogger', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({ data: mockTodayRoutine });
    (api.post as jest.Mock).mockResolvedValue({});
  });

  it('renders quick routine logger', async () => {
    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Today\'s Routine')).toBeInTheDocument();
      expect(screen.getByText('Quick Log')).toBeInTheDocument();
    });
  });

  it('loads today\'s routine items', async () => {
    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
      expect(screen.getByText('Squats')).toBeInTheDocument();
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
      expect(screen.getByText('Lunch')).toBeInTheDocument();
    });
  });

  it('displays routine item details correctly', async () => {
    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('3 sets x 10 reps')).toBeInTheDocument();
      expect(screen.getByText('3 sets x 15 reps')).toBeInTheDocument();
      expect(screen.getByText('400 cal')).toBeInTheDocument();
      expect(screen.getByText('600 cal')).toBeInTheDocument();
    });
  });

  it('allows toggling completion status', async () => {
    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
    });

    const pushupsCheckbox = screen.getByLabelText('Complete Push-ups');
    fireEvent.click(pushupsCheckbox);

    expect(pushupsCheckbox).toBeChecked();
  });

  it('allows editing workout details', async () => {
    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText('Edit Push-ups');
    fireEvent.click(editButton);

    // Should show edit form
    expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // Sets
    expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // Reps
  });

  it('saves edited workout details', async () => {
    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText('Edit Push-ups');
    fireEvent.click(editButton);

    // Edit the values
    const setsInput = screen.getByDisplayValue('3');
    fireEvent.change(setsInput, { target: { value: '4' } });

    const repsInput = screen.getByDisplayValue('10');
    fireEvent.change(repsInput, { target: { value: '12' } });

    // Save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('4 sets x 12 reps')).toBeInTheDocument();
    });
  });

  it('logs completed items successfully', async () => {
    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
    });

    // Complete a workout
    const pushupsCheckbox = screen.getByLabelText('Complete Push-ups');
    fireEvent.click(pushupsCheckbox);

    // Log the completed items
    const logButton = screen.getByText('Log Completed');
    fireEvent.click(logButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/health/contextual-logging/log-workout', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Routine logged successfully!');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles no routine items', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { fitness: [], nutrition: [] } });

    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('No routine items for today')).toBeInTheDocument();
      expect(screen.getByText('Check back later or create a routine')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load routine')).toBeInTheDocument();
    });
  });

  it('handles logging errors gracefully', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('Logging failed'));

    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
    });

    // Complete a workout
    const pushupsCheckbox = screen.getByLabelText('Complete Push-ups');
    fireEvent.click(pushupsCheckbox);

    // Try to log
    const logButton = screen.getByText('Log Completed');
    fireEvent.click(logButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to log routine');
    });
  });

  it('shows progress indicator', async () => {
    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('0/4 completed')).toBeInTheDocument();
    });

    // Complete one item
    const pushupsCheckbox = screen.getByLabelText('Complete Push-ups');
    fireEvent.click(pushupsCheckbox);

    expect(screen.getByText('1/4 completed')).toBeInTheDocument();
  });

  it('displays motivational messages', async () => {
    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Let\'s get started!')).toBeInTheDocument();
    });
  });

  it('shows completion celebration', async () => {
    render(<QuickRoutineLogger onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
    });

    // Complete all items
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => fireEvent.click(checkbox));

    await waitFor(() => {
      expect(screen.getByText('🎉 All done! Great job!')).toBeInTheDocument();
    });
  });
});
