import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import ProgressCard from '../ProgressCard';

describe('ProgressCard Component', () => {
  const defaultProps = {
    title: 'Test Progress',
    current: 75,
    goal: 100,
    unit: 'steps',
    color: '#3b82f6',
    icon: 'walk',
  };

  it('renders with default props', () => {
    render(<ProgressCard {...defaultProps} />);
    expect(screen.getByText('Test Progress')).toBeTruthy();
    expect(screen.getByText('75')).toBeTruthy();
    expect(screen.getByText('100')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<ProgressCard {...defaultProps} size="small" />);
    expect(screen.getByText('Test Progress')).toBeTruthy();

    rerender(<ProgressCard {...defaultProps} size="medium" />);
    expect(screen.getByText('Test Progress')).toBeTruthy();

    rerender(<ProgressCard {...defaultProps} size="large" />);
    expect(screen.getByText('Test Progress')).toBeTruthy();
  });

  it('renders with trend information', () => {
    render(
      <ProgressCard 
        {...defaultProps} 
        trend="up" 
        trendValue={15} 
      />
    );
    expect(screen.getByText('15%')).toBeTruthy();
  });

  it('renders different trend types', () => {
    const { rerender } = render(
      <ProgressCard 
        {...defaultProps} 
        trend="up" 
        trendValue={10} 
      />
    );
    expect(screen.getByText('10%')).toBeTruthy();

    rerender(
      <ProgressCard 
        {...defaultProps} 
        trend="down" 
        trendValue={5} 
      />
    );
    expect(screen.getByText('5%')).toBeTruthy();

    rerender(
      <ProgressCard 
        {...defaultProps} 
        trend="stable" 
        trendValue={0} 
      />
    );
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('shows motivational text based on progress', () => {
    const { rerender } = render(
      <ProgressCard 
        {...defaultProps} 
        current={100} 
        goal={100} 
      />
    );
    expect(screen.getByText('Goal achieved! 🎉')).toBeTruthy();

    rerender(
      <ProgressCard 
        {...defaultProps} 
        current={80} 
        goal={100} 
      />
    );
    expect(screen.getByText('Almost there! 💪')).toBeTruthy();

    rerender(
      <ProgressCard 
        {...defaultProps} 
        current={50} 
        goal={100} 
      />
    );
    expect(screen.getByText('Great progress! 🌟')).toBeTruthy();

    rerender(
      <ProgressCard 
        {...defaultProps} 
        current={10} 
        goal={100} 
      />
    );
    expect(screen.getByText('Keep going! 🚀')).toBeTruthy();

    rerender(
      <ProgressCard 
        {...defaultProps} 
        current={0} 
        goal={100} 
      />
    );
    expect(screen.getByText("Let's start! 💫")).toBeTruthy();
  });

  it('handles press events when onPress is provided', () => {
    const mockPress = jest.fn();
    render(<ProgressCard {...defaultProps} onPress={mockPress} />);
    
    const card = screen.getByText('Test Progress').parent?.parent;
    if (card) {
      fireEvent.press(card);
      expect(mockPress).toHaveBeenCalled();
    }
  });

  it('renders without onPress when not provided', () => {
    render(<ProgressCard {...defaultProps} />);
    expect(screen.getByText('Test Progress')).toBeTruthy();
    // Should not be wrapped in TouchableOpacity
  });

  it('calculates progress percentage correctly', () => {
    render(<ProgressCard {...defaultProps} current={25} goal={100} />);
    expect(screen.getByText('25%')).toBeTruthy();

    render(<ProgressCard {...defaultProps} current={150} goal={100} />);
    expect(screen.getByText('100%')).toBeTruthy(); // Should cap at 100%
  });

  it('renders with different colors and icons', () => {
    render(
      <ProgressCard 
        {...defaultProps} 
        color="#ef4444" 
        icon="heart" 
      />
    );
    expect(screen.getByText('Test Progress')).toBeTruthy();
  });

  it('renders stat labels correctly', () => {
    render(<ProgressCard {...defaultProps} />);
    expect(screen.getByText('Current')).toBeTruthy();
    expect(screen.getByText('Goal')).toBeTruthy();
    expect(screen.getByText('Progress')).toBeTruthy();
  });
});
