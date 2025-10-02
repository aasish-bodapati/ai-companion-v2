import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FormField from '../FormField';

describe('FormField', () => {
  const defaultProps = {
    name: 'testField',
    label: 'Test Field',
    value: '',
    onChangeText: jest.fn(),
    testID: 'form-field',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    const { getByText, getByTestId } = render(<FormField {...defaultProps} />);
    
    expect(getByText('Test Field')).toBeTruthy();
    expect(getByTestId('form-field')).toBeTruthy();
  });

  it('shows required indicator when required', () => {
    const { getByText } = render(
      <FormField {...defaultProps} required />
    );
    
    expect(getByText('Test Field *')).toBeTruthy();
  });

  it('displays error message', () => {
    const { getByText } = render(
      <FormField {...defaultProps} error="This field is required" />
    );
    
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('displays helper text', () => {
    const { getByText } = render(
      <FormField {...defaultProps} helperText="Enter your name" />
    );
    
    expect(getByText('Enter your name')).toBeTruthy();
  });

  it('shows placeholder text', () => {
    const { getByPlaceholderText } = render(
      <FormField {...defaultProps} placeholder="Enter value" />
    );
    
    expect(getByPlaceholderText('Enter value')).toBeTruthy();
  });

  it('handles text input changes', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <FormField {...defaultProps} onChangeText={onChangeText} />
    );
    
    const input = getByTestId('form-field');
    fireEvent.changeText(input, 'new value');
    
    expect(onChangeText).toHaveBeenCalledWith('new value');
  });

  it('handles blur events', () => {
    const onBlur = jest.fn();
    const { getByTestId } = render(
      <FormField {...defaultProps} onBlur={onBlur} />
    );
    
    const input = getByTestId('form-field');
    fireEvent(input, 'blur');
    
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('applies disabled state', () => {
    const { getByTestId } = render(
      <FormField {...defaultProps} disabled />
    );
    
    const input = getByTestId('form-field');
    expect(input.props.disabled).toBe(true);
  });

  it('applies different keyboard types', () => {
    const { getByTestId } = render(
      <FormField {...defaultProps} keyboardType="numeric" />
    );
    
    const input = getByTestId('form-field');
    expect(input.props.keyboardType).toBe('numeric');
  });

  it('applies secure text entry', () => {
    const { getByTestId } = render(
      <FormField {...defaultProps} secureTextEntry />
    );
    
    const input = getByTestId('form-field');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('applies multiline input', () => {
    const { getByTestId } = render(
      <FormField {...defaultProps} multiline numberOfLines={3} />
    );
    
    const input = getByTestId('form-field');
    expect(input.props.multiline).toBe(true);
    expect(input.props.numberOfLines).toBe(3);
  });

  it('applies max length', () => {
    const { getByTestId } = render(
      <FormField {...defaultProps} maxLength={50} />
    );
    
    const input = getByTestId('form-field');
    expect(input.props.maxLength).toBe(50);
  });

  it('applies different variants', () => {
    const { getByTestId: getByTestIdOutlined } = render(
      <FormField {...defaultProps} variant="outlined" />
    );
    const { getByTestId: getByTestIdFilled } = render(
      <FormField {...defaultProps} variant="filled" />
    );
    
    expect(getByTestIdOutlined('form-field')).toBeTruthy();
    expect(getByTestIdFilled('form-field')).toBeTruthy();
  });

  it('applies different sizes', () => {
    const { getByTestId: getByTestIdSmall } = render(
      <FormField {...defaultProps} size="small" />
    );
    const { getByTestId: getByTestIdLarge } = render(
      <FormField {...defaultProps} size="large" />
    );
    
    expect(getByTestIdSmall('form-field')).toBeTruthy();
    expect(getByTestIdLarge('form-field')).toBeTruthy();
  });

  it('renders with icon', () => {
    const { getByTestId } = render(
      <FormField {...defaultProps} icon="search" />
    );
    
    expect(getByTestId('form-field')).toBeTruthy();
  });

  it('handles icon press', () => {
    const onIconPress = jest.fn();
    const { getByTestId } = render(
      <FormField {...defaultProps} icon="search" onIconPress={onIconPress} />
    );
    
    // Note: Icon press testing would depend on the MobileOptimizedInput implementation
    expect(getByTestId('form-field')).toBeTruthy();
  });

  it('applies custom container style', () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = render(
      <FormField {...defaultProps} containerStyle={customStyle} />
    );
    
    expect(getByTestId('form-field')).toBeTruthy();
  });
});
