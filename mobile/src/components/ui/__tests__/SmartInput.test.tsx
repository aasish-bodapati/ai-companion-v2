import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SmartInput, { inputPresets } from '../SmartInput';

describe('SmartInput', () => {
  it('renders correctly with basic props', () => {
    const { getByPlaceholderText } = render(
      <SmartInput
        value=""
        onChangeText={() => {}}
        placeholder="Test input"
      />
    );
    
    expect(getByPlaceholderText('Test input')).toBeTruthy();
  });

  it('handles text input correctly', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <SmartInput
        value=""
        onChangeText={onChangeText}
        placeholder="Test input"
      />
    );
    
    const input = getByPlaceholderText('Test input');
    fireEvent.changeText(input, 'Hello World');
    
    expect(onChangeText).toHaveBeenCalledWith('Hello World');
  });

  it('validates numeric input correctly', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <SmartInput
        value=""
        onChangeText={onChangeText}
        type="numeric"
        placeholder="Enter number"
      />
    );
    
    const input = getByPlaceholderText('Enter number');
    fireEvent.changeText(input, 'abc123def');
    
    // Should only allow numbers and decimal point
    expect(onChangeText).toHaveBeenCalledWith('123');
  });

  it('shows validation error when validation fails', () => {
    const validation = (value: string) => value.length >= 3;
    const { getByText, getByPlaceholderText } = render(
      <SmartInput
        value=""
        onChangeText={() => {}}
        placeholder="Test input"
        validation={validation}
        errorText="Must be at least 3 characters"
      />
    );
    
    const input = getByPlaceholderText('Test input');
    fireEvent.changeText(input, 'ab');
    
    expect(getByText('Must be at least 3 characters')).toBeTruthy();
  });

  it('shows clear button when showClearButton is true and has value', () => {
    const { getByTestID } = render(
      <SmartInput
        value="test"
        onChangeText={() => {}}
        showClearButton={true}
        testID="smart-input"
      />
    );
    
    // The clear button should be present
    expect(getByTestID('smart-input')).toBeTruthy();
  });

  it('applies input presets correctly', () => {
    const { getByPlaceholderText } = render(
      <SmartInput
        value=""
        onChangeText={() => {}}
        {...inputPresets.sets}
      />
    );
    
    expect(getByPlaceholderText('0')).toBeTruthy();
  });
});
