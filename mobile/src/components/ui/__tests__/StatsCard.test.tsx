import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StatsCard from '../StatsCard';

describe('StatsCard', () => {
  const defaultProps = {
    title: 'Test Stat',
    value: '100',
    testID: 'stats-card',
  };

  it('renders correctly with basic props', () => {
    const { getByText, getByTestId } = render(<StatsCard {...defaultProps} />);
    
    expect(getByText('Test Stat')).toBeTruthy();
    expect(getByText('100')).toBeTruthy();
    expect(getByTestId('stats-card')).toBeTruthy();
  });

  it('renders with subtitle', () => {
    const { getByText } = render(
      <StatsCard {...defaultProps} subtitle="Test subtitle" />
    );
    
    expect(getByText('Test subtitle')).toBeTruthy();
  });

  it('renders with icon', () => {
    const { getByTestId } = render(
      <StatsCard {...defaultProps} icon="heart" />
    );
    
    expect(getByTestId('stats-card')).toBeTruthy();
  });

  it('renders trend information', () => {
    const { getByText } = render(
      <StatsCard 
        {...defaultProps} 
        trend="up" 
        trendValue="+5%" 
      />
    );
    
    expect(getByText('+5%')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <StatsCard {...defaultProps} onPress={onPress} />
    );
    
    fireEvent.press(getByTestId('stats-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <StatsCard {...defaultProps} onPress={onPress} disabled />
    );
    
    fireEvent.press(getByTestId('stats-card'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <StatsCard {...defaultProps} onPress={onPress} loading />
    );
    
    fireEvent.press(getByTestId('stats-card'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const { getByText } = render(
      <StatsCard {...defaultProps} loading />
    );
    
    expect(getByText('...')).toBeTruthy();
  });

  it('applies different variants', () => {
    const { getByTestId: getByTestIdPrimary } = render(
      <StatsCard {...defaultProps} variant="primary" />
    );
    const { getByTestId: getByTestIdSuccess } = render(
      <StatsCard {...defaultProps} variant="success" />
    );
    const { getByTestId: getByTestIdError } = render(
      <StatsCard {...defaultProps} variant="error" />
    );
    
    expect(getByTestIdPrimary('stats-card')).toBeTruthy();
    expect(getByTestIdSuccess('stats-card')).toBeTruthy();
    expect(getByTestIdError('stats-card')).toBeTruthy();
  });

  it('applies different sizes', () => {
    const { getByTestId: getByTestIdSmall } = render(
      <StatsCard {...defaultProps} size="small" />
    );
    const { getByTestId: getByTestIdLarge } = render(
      <StatsCard {...defaultProps} size="large" />
    );
    
    expect(getByTestIdSmall('stats-card')).toBeTruthy();
    expect(getByTestIdLarge('stats-card')).toBeTruthy();
  });

  it('renders with custom icon color', () => {
    const { getByTestId } = render(
      <StatsCard {...defaultProps} icon="heart" iconColor="#FF0000" />
    );
    
    expect(getByTestId('stats-card')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: '#FF0000' };
    const { getByTestId } = render(
      <StatsCard {...defaultProps} style={customStyle} />
    );
    
    expect(getByTestId('stats-card')).toBeTruthy();
  });
});
