import React from 'react';
import { render } from '@testing-library/react-native';
import StatsCard from '../StatsCard';

// Mock the haptic feedback
jest.mock('../../../utils/haptics', () => ({
  hapticFeedback: {
    light: jest.fn(),
  },
}));

describe('Basic UI Component Test', () => {
  it('renders StatsCard without crashing', () => {
    const { getByText } = render(
      <StatsCard
        title="Test Stat"
        value="100"
        testID="test-stat"
      />
    );
    
    expect(getByText('Test Stat')).toBeTruthy();
    expect(getByText('100')).toBeTruthy();
  });

  it('renders with different props', () => {
    const { getByText } = render(
      <StatsCard
        title="Water Intake"
        value="1500ml"
        subtitle="Goal: 2000ml"
        icon="water"
        variant="primary"
        testID="water-stat"
      />
    );
    
    expect(getByText('Water Intake')).toBeTruthy();
    expect(getByText('1500ml')).toBeTruthy();
    expect(getByText('Goal: 2000ml')).toBeTruthy();
  });
});
