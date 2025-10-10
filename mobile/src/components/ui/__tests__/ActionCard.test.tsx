import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import ActionCard from '../ActionCard';

// Mock the theme constants
jest.mock('../../../theme/constants', () => ({
  COLORS: {
    primary: { main: '#3b82f6' },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      inverse: '#ffffff',
    },
    background: {
      primary: '#ffffff',
    },
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    gray: {
      200: '#e5e7eb',
      300: '#d1d5db',
    },
    border: {
      medium: '#d1d5db',
    },
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  FONT_SIZE: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
  },
  FONT_WEIGHT: {
    medium: '500',
    semibold: '600',
  },
  BORDER_RADIUS: {
    sm: 4,
  },
  MIXINS: {
    card: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowSpaceBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    buttonBase: {
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
  },
}));

// Mock haptic feedback
jest.mock('../../../utils/haptics', () => ({
  hapticFeedback: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    selection: jest.fn(),
  },
}));

describe('ActionCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(
      <ActionCard
        title="Test Card"
        subtitle="Test Subtitle"
        description="Test description"
      />
    );
    
    expect(screen.getByText('Test Card')).toBeTruthy();
    expect(screen.getByText('Test Subtitle')).toBeTruthy();
    expect(screen.getByText('Test description')).toBeTruthy();
  });

  it('renders with icon', () => {
    render(
      <ActionCard
        title="Test Card"
        icon="heart"
        iconColor="#ff0000"
      />
    );
    
    expect(screen.getByText('Test Card')).toBeTruthy();
  });

  it('renders with badges', () => {
    const badges = [
      { text: 'New', variant: 'success' as const },
      { text: 'Featured', variant: 'info' as const },
    ];
    
    render(
      <ActionCard
        title="Test Card"
        badges={badges}
      />
    );
    
    expect(screen.getByText('New')).toBeTruthy();
    expect(screen.getByText('Featured')).toBeTruthy();
  });

  it('renders with status', () => {
    const status = {
      text: 'Active',
      variant: 'active' as const,
      icon: 'checkmark-circle',
    };
    
    render(
      <ActionCard
        title="Test Card"
        status={status}
      />
    );
    
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('renders with details', () => {
    const details = [
      { label: 'Steps', value: '7500', icon: 'walk' },
      { label: 'Calories', value: '1500', icon: 'flame' },
    ];
    
    render(
      <ActionCard
        title="Test Card"
        details={details}
      />
    );
    
    expect(screen.getByText('7500')).toBeTruthy();
    expect(screen.getByText('Steps')).toBeTruthy();
    expect(screen.getByText('1500')).toBeTruthy();
    expect(screen.getByText('Calories')).toBeTruthy();
  });

  it('renders with primary action', () => {
    const primaryAction = {
      label: 'Start Workout',
      icon: 'play',
      onPress: jest.fn(),
    };
    
    render(
      <ActionCard
        title="Test Card"
        primaryAction={primaryAction}
      />
    );
    
    expect(screen.getByText('Start Workout')).toBeTruthy();
  });

  it('renders with secondary actions', () => {
    const secondaryActions = [
      { label: 'Edit', icon: 'pencil', onPress: jest.fn() },
      { label: 'Delete', icon: 'trash', onPress: jest.fn() },
    ];
    
    render(
      <ActionCard
        title="Test Card"
        secondaryActions={secondaryActions}
      />
    );
    
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('handles primary action press', () => {
    const mockPress = jest.fn();
    const primaryAction = {
      label: 'Start Workout',
      onPress: mockPress,
    };
    
    render(
      <ActionCard
        title="Test Card"
        primaryAction={primaryAction}
      />
    );
    
    const button = screen.getByText('Start Workout');
    fireEvent.press(button);
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('handles secondary action press', () => {
    const mockPress = jest.fn();
    const secondaryActions = [
      { label: 'Edit', onPress: mockPress },
    ];
    
    render(
      <ActionCard
        title="Test Card"
        secondaryActions={secondaryActions}
      />
    );
    
    const button = screen.getByText('Edit');
    fireEvent.press(button);
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('renders disabled action', () => {
    const primaryAction = {
      label: 'Disabled Action',
      onPress: jest.fn(),
      disabled: true,
    };
    
    render(
      <ActionCard
        title="Test Card"
        primaryAction={primaryAction}
      />
    );
    
    expect(screen.getByText('Disabled Action')).toBeTruthy();
  });

  it('renders loading action', () => {
    const primaryAction = {
      label: 'Loading Action',
      onPress: jest.fn(),
      loading: true,
    };
    
    render(
      <ActionCard
        title="Test Card"
        primaryAction={primaryAction}
      />
    );
    
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders different variants', () => {
    const { rerender } = render(
      <ActionCard title="Default" variant="default" />
    );
    expect(screen.getByText('Default')).toBeTruthy();

    rerender(
      <ActionCard title="Compact" variant="compact" />
    );
    expect(screen.getByText('Compact')).toBeTruthy();

    rerender(
      <ActionCard title="Detailed" variant="detailed" />
    );
    expect(screen.getByText('Detailed')).toBeTruthy();
  });

  it('handles card press when onPress is provided', () => {
    const mockPress = jest.fn();
    render(
      <ActionCard
        title="Pressable Card"
        onPress={mockPress}
      />
    );
    
    const card = screen.getByText('Pressable Card');
    fireEvent.press(card);
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('renders with custom background color', () => {
    render(
      <ActionCard
        title="Custom Background"
        backgroundColor="#f0f0f0"
      />
    );
    
    expect(screen.getByText('Custom Background')).toBeTruthy();
  });

  it('renders action with different variants', () => {
    const actions = [
      { label: 'Primary', variant: 'primary' as const, onPress: jest.fn() },
      { label: 'Secondary', variant: 'secondary' as const, onPress: jest.fn() },
      { label: 'Success', variant: 'success' as const, onPress: jest.fn() },
      { label: 'Warning', variant: 'warning' as const, onPress: jest.fn() },
      { label: 'Danger', variant: 'danger' as const, onPress: jest.fn() },
      { label: 'Ghost', variant: 'ghost' as const, onPress: jest.fn() },
    ];
    
    render(
      <ActionCard
        title="Action Variants"
        secondaryActions={actions}
      />
    );
    
    actions.forEach(action => {
      expect(screen.getByText(action.label)).toBeTruthy();
    });
  });
});
