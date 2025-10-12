import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProgressBar from '../ProgressBar';

describe('ProgressBar Component', () => {
  it('renders correctly with basic props', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={50}
        testID="test-progress-bar"
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders with label when provided', () => {
    const { getByText } = render(
      <ProgressBar
        progress={50}
        label="Test Progress"
      />
    );
    
    expect(getByText('Test Progress')).toBeTruthy();
  });

  it('renders percentage when showPercentage is true', () => {
    const { getByText } = render(
      <ProgressBar
        progress={75}
        showPercentage={true}
      />
    );
    
    expect(getByText('75%')).toBeTruthy();
  });

  it('renders value when showValue is true', () => {
    const { getByText } = render(
      <ProgressBar
        progress={60}
        showValue={true}
        valueLabel="60%"
      />
    );
    
    expect(getByText('60%')).toBeTruthy();
  });

  it('renders with unit when provided', () => {
    const { getByText } = render(
      <ProgressBar
        progress={80}
        showValue={true}
        unit="kg"
      />
    );
    
    expect(getByText('80kg')).toBeTruthy();
  });

  it('renders circular progress bar when shape is circular', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={50}
        shape="circular"
        testID="test-progress-bar"
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders linear progress bar when shape is not circular', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={50}
        shape="rounded"
        testID="test-progress-bar"
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('handles progress values correctly', () => {
    const { getByText } = render(
      <ProgressBar
        progress={0}
        showPercentage={true}
      />
    );
    
    expect(getByText('0%')).toBeTruthy();
  });

  it('handles maximum progress values correctly', () => {
    const { getByText } = render(
      <ProgressBar
        progress={100}
        showPercentage={true}
      />
    );
    
    expect(getByText('100%')).toBeTruthy();
  });

  it('clamps progress values to 0-100 range', () => {
    const { getByText } = render(
      <ProgressBar
        progress={150}
        showPercentage={true}
      />
    );
    
    expect(getByText('100%')).toBeTruthy();
  });

  it('clamps negative progress values to 0', () => {
    const { getByText } = render(
      <ProgressBar
        progress={-10}
        showPercentage={true}
      />
    );
    
    expect(getByText('0%')).toBeTruthy();
  });

  it('renders different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const { getByTestId } = render(
        <ProgressBar
          progress={50}
          size={size}
          testID={`test-progress-bar-${size}`}
        />
      );
      
      expect(getByTestId(`test-progress-bar-${size}`)).toBeTruthy();
    });
  });

  it('renders different variants correctly', () => {
    const variants = ['default', 'minimal', 'filled', 'outlined', 'gradient'] as const;
    
    variants.forEach(variant => {
      const { getByTestId } = render(
        <ProgressBar
          progress={50}
          variant={variant}
          testID={`test-progress-bar-${variant}`}
        />
      );
      
      expect(getByTestId(`test-progress-bar-${variant}`)).toBeTruthy();
    });
  });

  it('renders different shapes correctly', () => {
    const shapes = ['rectangular', 'rounded', 'pill', 'circular'] as const;
    
    shapes.forEach(shape => {
      const { getByTestId } = render(
        <ProgressBar
          progress={50}
          shape={shape}
          testID={`test-progress-bar-${shape}`}
        />
      );
      
      expect(getByTestId(`test-progress-bar-${shape}`)).toBeTruthy();
    });
  });

  it('applies custom colors correctly', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={50}
        color="#ff0000"
        backgroundColor="#f0f0f0"
        textColor="#000000"
        testID="test-progress-bar"
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('handles custom max values correctly', () => {
    const { getByText } = render(
      <ProgressBar
        progress={50}
        max={200}
        showPercentage={true}
      />
    );
    
    expect(getByText('25%')).toBeTruthy();
  });

  it('renders with accessibility props', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={50}
        testID="test-progress-bar"
        accessibilityLabel="Progress bar"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: 50, text: '50%' }}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('handles empty data gracefully', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={0}
        testID="test-progress-bar"
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders with all display options enabled', () => {
    const { getByText } = render(
      <ProgressBar
        progress={75}
        showPercentage={true}
        showLabel={true}
        showValue={true}
        label="Test Progress"
        valueLabel="75%"
        unit="%"
      />
    );
    
    expect(getByText('Test Progress')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
  });

  it('renders with minimal display options', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={50}
        showPercentage={false}
        showLabel={false}
        showValue={false}
        testID="test-progress-bar"
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });
});
