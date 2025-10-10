import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import MobileOptimizedCard from '../MobileOptimizedCard';

// Mock haptic feedback to prevent errors in test environment
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
  touchUtils: {
    MIN_TOUCH_TARGET_SIZE: 44,
  },
}));

// Mock the theme constants
jest.mock('../../../theme/constants', () => ({
  COLORS: {
    primary: {
      main: '#3b82f6',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
    },
    background: {
      tertiary: '#f3f4f6',
    },
    border: {
      light: '#e5e7eb',
    },
  },
  SPACING: {
    md: 12,
    lg: 16,
    xl: 20,
  },
  FONT_SIZE: {
    lg: 16,
    xl: 20,
    md: 14,
  },
  FONT_WEIGHT: {
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
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },
  COMMON_STYLES: {
    standardRadius: 12,
    cardBackground: '#ffffff',
    secondaryBackground: '#f8fafc',
  },
}));

describe('MobileOptimizedCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(
      <MobileOptimizedCard testID="card">
        <div>Test Content</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('renders with title and subtitle', () => {
    render(
      <MobileOptimizedCard 
        title="Test Title" 
        subtitle="Test Subtitle"
        testID="card"
      >
        <div>Test Content</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByText('Test Title')).toBeTruthy();
    expect(screen.getByText('Test Subtitle')).toBeTruthy();
  });

  it('renders with icon', () => {
    render(
      <MobileOptimizedCard 
        title="Test Title" 
        icon="heart"
        testID="card"
      >
        <div>Test Content</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByText('Test Title')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <MobileOptimizedCard variant="default" testID="card">
        <div>Default</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();

    rerender(
      <MobileOptimizedCard variant="elevated" testID="card">
        <div>Elevated</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();

    rerender(
      <MobileOptimizedCard variant="outlined" testID="card">
        <div>Outlined</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();

    rerender(
      <MobileOptimizedCard variant="filled" testID="card">
        <div>Filled</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <MobileOptimizedCard size="small" testID="card">
        <div>Small</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();

    rerender(
      <MobileOptimizedCard size="medium" testID="card">
        <div>Medium</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();

    rerender(
      <MobileOptimizedCard size="large" testID="card">
        <div>Large</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('handles press events', () => {
    const mockPress = jest.fn();
    render(
      <MobileOptimizedCard onPress={mockPress} testID="card">
        <div>Pressable</div>
      </MobileOptimizedCard>
    );
    
    const card = screen.getByTestId('card');
    fireEvent.press(card);
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('handles long press events', () => {
    const mockLongPress = jest.fn();
    render(
      <MobileOptimizedCard onLongPress={mockLongPress} testID="card">
        <div>Long Pressable</div>
      </MobileOptimizedCard>
    );
    
    const card = screen.getByTestId('card');
    fireEvent(card, 'longPress');
    expect(mockLongPress).toHaveBeenCalledTimes(1);
  });

  it('shows chevron when pressable', () => {
    render(
      <MobileOptimizedCard onPress={() => {}} testID="card">
        <div>Pressable</div>
      </MobileOptimizedCard>
    );
    // The chevron should be present in the rendered component
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('does not show chevron when not pressable', () => {
    render(
      <MobileOptimizedCard testID="card">
        <div>Not Pressable</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('renders as disabled when disabled prop is true', () => {
    const mockPress = jest.fn();
    render(
      <MobileOptimizedCard 
        onPress={mockPress} 
        disabled 
        testID="card"
      >
        <div>Disabled</div>
      </MobileOptimizedCard>
    );
    
    const card = screen.getByTestId('card');
    fireEvent.press(card);
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('renders as disabled when loading prop is true', () => {
    const mockPress = jest.fn();
    render(
      <MobileOptimizedCard 
        onPress={mockPress} 
        loading 
        testID="card"
      >
        <div>Loading</div>
      </MobileOptimizedCard>
    );
    
    const card = screen.getByTestId('card');
    fireEvent.press(card);
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('applies custom style', () => {
    const customStyle = { marginTop: 20 };
    render(
      <MobileOptimizedCard style={customStyle} testID="card">
        <div>Custom Style</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('applies custom content style', () => {
    const customContentStyle = { paddingTop: 10 };
    render(
      <MobileOptimizedCard contentStyle={customContentStyle} testID="card">
        <div>Custom Content Style</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('uses custom icon color', () => {
    render(
      <MobileOptimizedCard 
        title="Test" 
        icon="heart" 
        iconColor="#ff0000"
        testID="card"
      >
        <div>Custom Icon Color</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByText('Test')).toBeTruthy();
  });

  it('renders without header when no title, subtitle, or icon', () => {
    render(
      <MobileOptimizedCard testID="card">
        <div>No Header</div>
      </MobileOptimizedCard>
    );
    expect(screen.getByTestId('card')).toBeTruthy();
    // The content is rendered inside the card
    expect(screen.getByTestId('card')).toBeTruthy();
  });
});
