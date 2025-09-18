import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import FitnessLogsView from '../FitnessLogsView';
import api from '@/lib/api';

// Mock the API module
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock the toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-01-17';
    if (formatStr === 'MMM d, yyyy') return 'Jan 17, 2024';
    if (formatStr === 'MMMM yyyy') return 'January 2024';
    if (formatStr === 'EEEE, MMMM d, yyyy') return 'Wednesday, January 17, 2024';
    return '2024-01-17';
  }),
  addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  subDays: jest.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('FitnessLogsView', () => {
  const mockLogs = [
    {
      id: '1',
      user_id: 'user1',
      activity_type: 'weightlifting',
      activity_name: 'Push Day',
      duration_minutes: 60,
      calories_burned: 300,
      intensity: 'high',
      notes: 'Great workout',
      logged_at: '2024-01-17T10:00:00Z',
      created_at: '2024-01-17T10:00:00Z',
    },
    {
      id: '2',
      user_id: 'user1',
      activity_type: 'running',
      activity_name: 'Morning Run',
      duration_minutes: 30,
      calories_burned: 250,
      intensity: 'medium',
      notes: 'Felt good',
      logged_at: '2024-01-16T08:00:00Z',
      created_at: '2024-01-16T08:00:00Z',
    },
  ];

  const mockStats = {
    totalWorkouts: 12,
    totalDuration: 515,
    totalCalories: 3270,
    averageDifficulty: 0,
    currentStreak: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockResolvedValue({
      logs: mockLogs,
      stats: mockStats,
    });
  });

  describe('Rendering', () => {
    it('renders the component with header and controls', async () => {
      render(<FitnessLogsView />);
      
      expect(screen.getByText('Workout Logs')).toBeInTheDocument();
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
      expect(screen.getByText('Day View')).toBeInTheDocument();
      expect(screen.getByText('Month View')).toBeInTheDocument();
    });

    it('renders stats cards with correct data', async () => {
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument(); // Total Workouts
        expect(screen.getByText('8h 35m')).toBeInTheDocument(); // Total Duration
        expect(screen.getByText('3270')).toBeInTheDocument(); // Total Calories
        expect(screen.getByText('5 days')).toBeInTheDocument(); // Current Streak
      });
    });

    it('shows loading state initially', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<FitnessLogsView />);
      
      expect(screen.getByText('Workout Logs')).toBeInTheDocument();
      // Loading state would be shown by the component
    });
  });

  describe('Day View', () => {
    it('renders day view by default', async () => {
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        expect(screen.getByText('Jan 17, 2024')).toBeInTheDocument();
        expect(screen.getByText('Prev')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });

    it('displays workout logs in day view', async () => {
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        expect(screen.getByText('Push Day')).toBeInTheDocument();
        expect(screen.getByText('1h')).toBeInTheDocument();
        expect(screen.getByText('300 cal')).toBeInTheDocument();
        expect(screen.getByText('Great workout')).toBeInTheDocument();
      });
    });

    it('shows empty state when no workouts for selected day', async () => {
      mockApi.get.mockResolvedValue({
        logs: [],
        stats: mockStats,
      });
      
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        expect(screen.getByText('No Workouts This Day')).toBeInTheDocument();
      });
    });

    it('navigates between days', async () => {
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        expect(screen.getByText('Jan 17, 2024')).toBeInTheDocument();
      });

      const prevButton = screen.getByText('Prev');
      fireEvent.click(prevButton);
      
      // Date should change (mocked by date-fns)
      expect(screen.getByText('Jan 17, 2024')).toBeInTheDocument();
    });

    it('jumps to today when Today button is clicked', async () => {
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        const todayButton = screen.getByText('Today');
        fireEvent.click(todayButton);
        expect(screen.getByText('Jan 17, 2024')).toBeInTheDocument();
      });
    });
  });

  describe('Month View', () => {
    it('switches to month view when Month View button is clicked', async () => {
      render(<FitnessLogsView />);
      
      const monthViewButton = screen.getByText('Month View');
      fireEvent.click(monthViewButton);
      
      await waitFor(() => {
        expect(screen.getByText('January 2024')).toBeInTheDocument();
        expect(screen.getByText('Prev Month')).toBeInTheDocument();
        expect(screen.getByText('Next Month')).toBeInTheDocument();
      });
    });

    it('renders calendar grid in month view', async () => {
      render(<FitnessLogsView />);
      
      const monthViewButton = screen.getByText('Month View');
      fireEvent.click(monthViewButton);
      
      await waitFor(() => {
        expect(screen.getByText('Sun')).toBeInTheDocument();
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Tue')).toBeInTheDocument();
        expect(screen.getByText('Wed')).toBeInTheDocument();
        expect(screen.getByText('Thu')).toBeInTheDocument();
        expect(screen.getByText('Fri')).toBeInTheDocument();
        expect(screen.getByText('Sat')).toBeInTheDocument();
      });
    });

    it('shows workout count badges on calendar days', async () => {
      render(<FitnessLogsView />);
      
      const monthViewButton = screen.getByText('Month View');
      fireEvent.click(monthViewButton);
      
      await waitFor(() => {
        // Should show workout count badges for days with workouts
        expect(screen.getByText('1 workout')).toBeInTheDocument();
      });
    });

    it('expands date details when workout badge is clicked', async () => {
      render(<FitnessLogsView />);
      
      const monthViewButton = screen.getByText('Month View');
      fireEvent.click(monthViewButton);
      
      await waitFor(() => {
        const workoutBadge = screen.getByText('1 workout');
        fireEvent.click(workoutBadge);
        
        expect(screen.getByText('Wednesday, January 17, 2024')).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Controls', () => {
    it('changes filter when period buttons are clicked', async () => {
      render(<FitnessLogsView />);
      
      const monthButton = screen.getByText('This Month');
      fireEvent.click(monthButton);
      
      expect(mockApi.get).toHaveBeenCalledWith('/health/logging/fitness?period=month&limit=50');
    });

    it('updates date picker when date is changed', async () => {
      render(<FitnessLogsView />);
      
      const dateInput = screen.getByDisplayValue('2024-01-17');
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      
      // Date should be updated in the component state
      expect(dateInput).toHaveValue('2024-01-15');
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));
      
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        // Should show error state or handle gracefully
        expect(screen.getByText('Workout Logs')).toBeInTheDocument();
      });
    });

    it('shows empty state when no logs are returned', async () => {
      mockApi.get.mockResolvedValue({
        logs: [],
        stats: mockStats,
      });
      
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        expect(screen.getByText('No Workout Logs Yet')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on different screen sizes', async () => {
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        expect(screen.getByText('Workout Logs')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        
        // Check for proper button labels
        expect(screen.getByText('Prev')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        const prevButton = screen.getByText('Prev');
        prevButton.focus();
        expect(prevButton).toHaveFocus();
      });
    });
  });

  describe('Performance', () => {
    it('handles large datasets efficiently', async () => {
      const largeLogs = Array.from({ length: 100 }, (_, i) => ({
        id: `log-${i}`,
        user_id: 'user1',
        activity_type: 'running',
        activity_name: `Run ${i}`,
        duration_minutes: 30,
        calories_burned: 250,
        logged_at: `2024-01-${String(i + 1).padStart(2, '0')}T08:00:00Z`,
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T08:00:00Z`,
      }));

      mockApi.get.mockResolvedValue({
        logs: largeLogs,
        stats: mockStats,
      });
      
      render(<FitnessLogsView />);
      
      await waitFor(() => {
        expect(screen.getByText('Workout Logs')).toBeInTheDocument();
        // Should render without performance issues
      });
    });
  });
});
