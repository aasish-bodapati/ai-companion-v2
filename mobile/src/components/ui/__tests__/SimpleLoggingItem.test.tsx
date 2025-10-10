import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import SimpleLoggingItem from '../SimpleLoggingItem';

// Mock the theme constants
jest.mock('../../../theme/constants', () => ({
  COLORS: {
    background: {
      primary: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    primary: {
      main: '#3b82f6',
    },
    border: {
      medium: '#d1d5db',
    },
  },
  BORDER_RADIUS: {
    sm: 6,
    lg: 12,
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
  },
  FONT_SIZE: {
    sm: 12,
    md: 14,
    lg: 16,
  },
  FONT_WEIGHT: {
    medium: '500',
    semibold: '600',
  },
  SHADOWS: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  },
}));

// Mock the Badge component
jest.mock('../Badge', () => ({
  CategoryBadge: ({ category, size }: { category: string; size: string }) => (
    <div data-testid={`category-badge-${category}`} data-size={size}>
      {category}
    </div>
  ),
}));

describe('SimpleLoggingItem Component', () => {
  const mockItem = {
    id: '1',
    name: 'Push-ups',
    category: 'bodyweight',
    sets: 3,
    reps: '10',
  };

  const mockOnUpdate = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(
      <SimpleLoggingItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    expect(screen.getByText('Push-ups')).toBeTruthy();
    expect(screen.getByTestId('category-badge-bodyweight')).toBeTruthy();
  });

  it('renders with different categories', () => {
    const { rerender } = render(
      <SimpleLoggingItem
        item={{ ...mockItem, category: 'weighted' }}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    expect(screen.getByTestId('category-badge-weighted')).toBeTruthy();

    rerender(
      <SimpleLoggingItem
        item={{ ...mockItem, category: 'cardio_duration' }}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    expect(screen.getByTestId('category-badge-cardio_duration')).toBeTruthy();

    rerender(
      <SimpleLoggingItem
        item={{ ...mockItem, category: 'distance_based' }}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    expect(screen.getByTestId('category-badge-distance_based')).toBeTruthy();
  });

  it('renders appropriate fields for bodyweight category', () => {
    render(
      <SimpleLoggingItem
        item={{ ...mockItem, category: 'bodyweight' }}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    expect(screen.getByText('Sets')).toBeTruthy();
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.queryByText('Weight (kg)')).toBeNull();
    expect(screen.queryByText('Duration (min)')).toBeNull();
  });

  it('renders appropriate fields for weighted category', () => {
    render(
      <SimpleLoggingItem
        item={{ ...mockItem, category: 'weighted' }}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    expect(screen.getByText('Sets')).toBeTruthy();
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.getByText('Weight (kg)')).toBeTruthy();
    expect(screen.getByText('Rest (sec)')).toBeTruthy();
  });

  it('renders appropriate fields for cardio category', () => {
    render(
      <SimpleLoggingItem
        item={{ ...mockItem, category: 'cardio_duration' }}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    expect(screen.getByText('Duration (min)')).toBeTruthy();
    expect(screen.queryByText('Sets')).toBeNull();
    expect(screen.queryByText('Weight (kg)')).toBeNull();
  });

  it('renders appropriate fields for distance category', () => {
    render(
      <SimpleLoggingItem
        item={{ ...mockItem, category: 'distance_based' }}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    expect(screen.getByText('Distance (km)')).toBeTruthy();
    expect(screen.getByText('Duration (min)')).toBeTruthy();
    expect(screen.queryByText('Sets')).toBeNull();
  });

  it('handles input changes for sets', () => {
    render(
      <SimpleLoggingItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    const setsInput = screen.getByDisplayValue('3');
    fireEvent.changeText(setsInput, '5');
    expect(mockOnUpdate).toHaveBeenCalledWith('1', { sets: 5 });
  });

  it('handles input changes for reps', () => {
    render(
      <SimpleLoggingItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    const repsInput = screen.getByDisplayValue('10');
    fireEvent.changeText(repsInput, '15');
    expect(mockOnUpdate).toHaveBeenCalledWith('1', { reps: '15' });
  });

  it('handles input changes for weight', () => {
    const weightedItem = { ...mockItem, category: 'weighted', weight_kg: 50 };
    render(
      <SimpleLoggingItem
        item={weightedItem}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    const weightInput = screen.getByDisplayValue('50');
    fireEvent.changeText(weightInput, '60');
    expect(mockOnUpdate).toHaveBeenCalledWith('1', { weight_kg: 60 });
  });

  it('handles input changes for duration', () => {
    const cardioItem = { ...mockItem, category: 'cardio_duration', duration_minutes: 30 };
    render(
      <SimpleLoggingItem
        item={cardioItem}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    const durationInput = screen.getByDisplayValue('30');
    fireEvent.changeText(durationInput, '45');
    expect(mockOnUpdate).toHaveBeenCalledWith('1', { duration_minutes: 45 });
  });

  it('handles input changes for distance', () => {
    const distanceItem = { ...mockItem, category: 'distance_based', distance: 5 };
    render(
      <SimpleLoggingItem
        item={distanceItem}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    const distanceInput = screen.getByDisplayValue('5');
    fireEvent.changeText(distanceInput, '10');
    expect(mockOnUpdate).toHaveBeenCalledWith('1', { distance: 10 });
  });

  it('handles remove button press', () => {
    render(
      <SimpleLoggingItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        editable={true}
      />
    );
    
    const removeButton = screen.getByTestId('remove-button');
    fireEvent.press(removeButton);
    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('does not show remove button when not editable', () => {
    render(
      <SimpleLoggingItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        editable={false}
      />
    );
    
    expect(screen.queryByTestId('remove-button')).toBeNull();
  });

  it('does not show remove button when onRemove is not provided', () => {
    render(
      <SimpleLoggingItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        editable={true}
      />
    );
    
    expect(screen.queryByTestId('remove-button')).toBeNull();
  });

  it('renders in read-only mode when not editable', () => {
    render(
      <SimpleLoggingItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        editable={false}
      />
    );
    
    expect(screen.getByText('3')).toBeTruthy(); // Sets value
    expect(screen.getByText('10')).toBeTruthy(); // Reps value
    expect(screen.queryByRole('textbox')).toBeNull(); // No text inputs
  });

  it('handles unknown category gracefully', () => {
    render(
      <SimpleLoggingItem
        item={{ ...mockItem, category: 'unknown' }}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );
    
    expect(screen.getByText('Push-ups')).toBeTruthy();
    expect(screen.getByTestId('category-badge-unknown')).toBeTruthy();
    // Should show all fields for unknown category
    expect(screen.getByText('Sets')).toBeTruthy();
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.getByText('Weight (kg)')).toBeTruthy();
    expect(screen.getByText('Duration (min)')).toBeTruthy();
    expect(screen.getByText('Distance (km)')).toBeTruthy();
  });

  it('displays correct values for different field types', () => {
    const itemWithAllFields = {
      ...mockItem,
      category: 'weighted',
      sets: 4,
      reps: '12',
      weight_kg: 75,
      rest_time: 60,
    };
    
    render(
      <SimpleLoggingItem
        item={itemWithAllFields}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
        editable={false}
      />
    );
    
    expect(screen.getByText('4')).toBeTruthy(); // Sets
    expect(screen.getByText('12')).toBeTruthy(); // Reps
    expect(screen.getByText('75 kg')).toBeTruthy(); // Weight
    expect(screen.getByText('60s')).toBeTruthy(); // Rest time
  });
});
