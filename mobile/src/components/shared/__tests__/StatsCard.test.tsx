import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import StatsCard from '../StatsCard';

// Mock the UnifiedProgressRing component
jest.mock('../../ui/UnifiedProgressRing', () => {
  return function MockUnifiedProgressRing({ label, onPress, testID }: Record<string, unknown>) {
    return (
      <div data-testid={testID as string} onClick={onPress as () => void}>
        {label}
      </div>
    );
  };
});

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
    primary: {
      main: '#3b82f6',
    },
    border: {
      light: '#e5e7eb',
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
    xl: 20,
  },
  FONT_WEIGHT: {
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  SHADOWS: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
  },
}));

describe('StatsCard Component', () => {
  const mockStats = [
    {
      id: '1',
      label: 'Steps',
      value: 5000,
      target: 10000,
      unit: ' steps',
      icon: 'walk',
      color: '#3b82f6',
      type: 'ring' as const,
    },
    {
      id: '2',
      label: 'Calories',
      value: 300,
      target: 500,
      unit: ' cal',
      icon: 'flame',
      color: '#ef4444',
      type: 'bar' as const,
    },
    {
      id: '3',
      label: 'Water',
      value: 6,
      target: 8,
      unit: ' glasses',
      icon: 'water',
      color: '#10b981',
      type: 'number' as const,
    },
  ];

  it('renders with default props', () => {
    render(<StatsCard title="Today's Stats" stats={mockStats} />);
    expect(screen.getByText("Today's Stats")).toBeTruthy();
  });

  it('renders with different layouts', () => {
    const { rerender } = render(
      <StatsCard title="Grid Layout" stats={mockStats} layout="grid" />
    );
    expect(screen.getByText('Grid Layout')).toBeTruthy();

    rerender(
      <StatsCard title="Horizontal Layout" stats={mockStats} layout="horizontal" />
    );
    expect(screen.getByText('Horizontal Layout')).toBeTruthy();

    rerender(
      <StatsCard title="Vertical Layout" stats={mockStats} layout="vertical" />
    );
    expect(screen.getByText('Vertical Layout')).toBeTruthy();
  });

  it('renders view all button when onViewAll is provided', () => {
    const mockViewAll = jest.fn();
    render(
      <StatsCard 
        title="Stats" 
        stats={mockStats} 
        onViewAll={mockViewAll} 
      />
    );
    
    const viewAllButton = screen.getByText('View All');
    expect(viewAllButton).toBeTruthy();
    
    fireEvent.press(viewAllButton);
    expect(mockViewAll).toHaveBeenCalledTimes(1);
  });

  it('renders ring stats correctly', () => {
    const ringStats = [mockStats[0]]; // Only ring type
    render(<StatsCard title="Ring Stats" stats={ringStats} />);
    expect(screen.getByText('Steps')).toBeTruthy();
  });

  it('renders bar stats correctly', () => {
    const barStats = [mockStats[1]]; // Only bar type
    render(<StatsCard title="Bar Stats" stats={barStats} />);
    expect(screen.getByText('Calories')).toBeTruthy();
    expect(screen.getByText('300 cal')).toBeTruthy();
    expect(screen.getByText('Target: 500 cal')).toBeTruthy();
  });

  it('renders number stats correctly', () => {
    const numberStats = [mockStats[2]]; // Only number type
    render(<StatsCard title="Number Stats" stats={numberStats} />);
    expect(screen.getByText('Water')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
    expect(screen.getByText('/ 8 glasses')).toBeTruthy();
  });

  it('hides targets when showTargets is false', () => {
    render(
      <StatsCard 
        title="No Targets" 
        stats={mockStats} 
        showTargets={false} 
      />
    );
    expect(screen.queryByText('Target: 500 cal')).toBeNull();
    expect(screen.queryByText('/ 8 glasses')).toBeNull();
  });

  it('handles stat press events', () => {
    const mockStatPress = jest.fn();
    render(
      <StatsCard 
        title="Pressable Stats" 
        stats={mockStats} 
        onStatPress={mockStatPress} 
      />
    );
    
    // Test bar stat press
    const barStat = screen.getByText('Calories');
    fireEvent.press(barStat);
    expect(mockStatPress).toHaveBeenCalledWith(mockStats[1]);
    
    // Test number stat press
    const numberStat = screen.getByText('Water');
    fireEvent.press(numberStat);
    expect(mockStatPress).toHaveBeenCalledWith(mockStats[2]);
  });

  it('calculates percentage correctly for bar stats', () => {
    const barStats = [mockStats[1]]; // 300/500 = 60%
    render(<StatsCard title="Percentage Test" stats={barStats} />);
    expect(screen.getByText('60%')).toBeTruthy();
  });

  it('caps percentage at 100%', () => {
    const overTargetStats = [{
      ...mockStats[1],
      value: 600, // Over target of 500
      target: 500,
    }];
    render(<StatsCard title="Over Target" stats={overTargetStats} />);
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('applies custom style', () => {
    const customStyle = { marginTop: 20 };
    render(
      <StatsCard 
        title="Custom Style" 
        stats={mockStats} 
        style={customStyle} 
      />
    );
    expect(screen.getByText('Custom Style')).toBeTruthy();
  });

  it('renders empty stats array gracefully', () => {
    render(<StatsCard title="Empty Stats" stats={[]} />);
    expect(screen.getByText('Empty Stats')).toBeTruthy();
  });

  it('handles mixed stat types', () => {
    render(<StatsCard title="Mixed Stats" stats={mockStats} />);
    expect(screen.getByText('Steps')).toBeTruthy();
    expect(screen.getByText('Calories')).toBeTruthy();
    expect(screen.getByText('Water')).toBeTruthy();
  });
});
