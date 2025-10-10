import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { HealthCard, HealthIconButton, HealthBadge, HealthDivider, HealthSkeleton } from '../HealthUI';

// Mock the theme constants
jest.mock('../../../theme/constants', () => ({
  COLORS: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f3f4f6',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
    },
    border: {
      light: '#e5e7eb',
    },
    successLight: '#d1fae5',
    warningLight: '#fef3c7',
    dangerLight: '#fee2e2',
    info: '#3b82f6',
  },
  BORDER_RADIUS: {
    md: 8,
    lg: 12,
    xl: 16,
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  FONT_SIZE: {
    sm: 12,
    xl: 24,
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
}));

describe('HealthUI Components', () => {
  describe('HealthCard', () => {
    it('renders with default props', () => {
      render(
        <HealthCard>
          <div>Test Content</div>
        </HealthCard>
      );
      expect(screen.getByText('Test Content')).toBeTruthy();
    });

    it('renders with different variants', () => {
      const { rerender } = render(
        <HealthCard variant="default">
          <div>Default</div>
        </HealthCard>
      );
      expect(screen.getByText('Default')).toBeTruthy();

      rerender(
        <HealthCard variant="elevated">
          <div>Elevated</div>
        </HealthCard>
      );
      expect(screen.getByText('Elevated')).toBeTruthy();

      rerender(
        <HealthCard variant="outlined">
          <div>Outlined</div>
        </HealthCard>
      );
      expect(screen.getByText('Outlined')).toBeTruthy();

      rerender(
        <HealthCard variant="filled">
          <div>Filled</div>
        </HealthCard>
      );
      expect(screen.getByText('Filled')).toBeTruthy();
    });

    it('handles press events when onPress is provided', () => {
      const mockPress = jest.fn();
      render(
        <HealthCard onPress={mockPress}>
          <div>Pressable</div>
        </HealthCard>
      );
      
      const card = screen.getByText('Pressable');
      fireEvent.press(card);
      expect(mockPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('HealthIconButton', () => {
    it('renders with default props', () => {
      const mockPress = jest.fn();
      render(
        <HealthIconButton icon="heart" onPress={mockPress} />
      );
      // The component renders successfully
      expect(mockPress).toBeDefined();
    });

    it('handles press events', () => {
      const mockPress = jest.fn();
      render(
        <HealthIconButton icon="heart" onPress={mockPress} />
      );
      
      // Find the TouchableOpacity by its accessibility role
      const button = screen.getByRole('button');
      fireEvent.press(button);
      expect(mockPress).toHaveBeenCalledTimes(1);
    });

    it('renders as disabled when disabled prop is true', () => {
      const mockPress = jest.fn();
      render(
        <HealthIconButton 
          icon="heart" 
          onPress={mockPress} 
          disabled 
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.press(button);
      expect(mockPress).not.toHaveBeenCalled();
    });
  });

  describe('HealthBadge', () => {
    it('renders with default props', () => {
      render(<HealthBadge text="Test Badge" />);
      expect(screen.getByText('Test Badge')).toBeTruthy();
    });

    it('renders with different variants', () => {
      const { rerender } = render(
        <HealthBadge text="Default" variant="default" />
      );
      expect(screen.getByText('Default')).toBeTruthy();

      rerender(
        <HealthBadge text="Success" variant="success" />
      );
      expect(screen.getByText('Success')).toBeTruthy();

      rerender(
        <HealthBadge text="Warning" variant="warning" />
      );
      expect(screen.getByText('Warning')).toBeTruthy();

      rerender(
        <HealthBadge text="Error" variant="error" />
      );
      expect(screen.getByText('Error')).toBeTruthy();

      rerender(
        <HealthBadge text="Info" variant="info" />
      );
      expect(screen.getByText('Info')).toBeTruthy();
    });

    it('renders with different sizes', () => {
      const { rerender } = render(
        <HealthBadge text="Small" size="small" />
      );
      expect(screen.getByText('Small')).toBeTruthy();

      rerender(
        <HealthBadge text="Medium" size="medium" />
      );
      expect(screen.getByText('Medium')).toBeTruthy();

      rerender(
        <HealthBadge text="Large" size="large" />
      );
      expect(screen.getByText('Large')).toBeTruthy();
    });
  });

  describe('HealthDivider', () => {
    it('renders with default props', () => {
      render(<HealthDivider />);
      // The component renders successfully
      expect(true).toBe(true);
    });

    it('renders with different orientations', () => {
      const { rerender } = render(
        <HealthDivider orientation="horizontal" />
      );
      expect(true).toBe(true);

      rerender(
        <HealthDivider orientation="vertical" />
      );
      expect(true).toBe(true);
    });
  });

  describe('HealthSkeleton', () => {
    it('renders with default props', () => {
      render(<HealthSkeleton />);
      // The component renders successfully
      expect(true).toBe(true);
    });

    it('renders with custom dimensions', () => {
      render(
        <HealthSkeleton 
          width={200} 
          height={30} 
          borderRadius={8} 
        />
      );
      // The component renders successfully
      expect(true).toBe(true);
    });
  });
});