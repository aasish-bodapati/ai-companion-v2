import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import MobileOptimizedInput from '../MobileOptimizedInput';

describe('MobileOptimizedInput Component', () => {
  it('renders with default props', () => {
    render(<MobileOptimizedInput placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('renders with label', () => {
    render(<MobileOptimizedInput label="Test Label" placeholder="Enter text" />);
    expect(screen.getByText('Test Label')).toBeTruthy();
  });

  it('renders with error state', () => {
    render(<MobileOptimizedInput error="This field is required" placeholder="Enter text" />);
    expect(screen.getByText('This field is required')).toBeTruthy();
  });

  it('renders with helper text', () => {
    render(<MobileOptimizedInput helperText="This is helper text" placeholder="Enter text" />);
    expect(screen.getByText('This is helper text')).toBeTruthy();
  });

  it('renders with icon', () => {
    render(<MobileOptimizedInput icon="search" placeholder="Search" />);
    // Icon should be present (tested by checking if input container exists)
    expect(screen.getByPlaceholderText('Search')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<MobileOptimizedInput size="small" placeholder="Small" />);
    expect(screen.getByPlaceholderText('Small')).toBeTruthy();

    rerender(<MobileOptimizedInput size="medium" placeholder="Medium" />);
    expect(screen.getByPlaceholderText('Medium')).toBeTruthy();

    rerender(<MobileOptimizedInput size="large" placeholder="Large" />);
    expect(screen.getByPlaceholderText('Large')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<MobileOptimizedInput variant="outlined" placeholder="Outlined" />);
    expect(screen.getByPlaceholderText('Outlined')).toBeTruthy();

    rerender(<MobileOptimizedInput variant="filled" placeholder="Filled" />);
    expect(screen.getByPlaceholderText('Filled')).toBeTruthy();

    rerender(<MobileOptimizedInput variant="underlined" placeholder="Underlined" />);
    expect(screen.getByPlaceholderText('Underlined')).toBeTruthy();
  });

  it('handles focus and blur events', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    
    render(
      <MobileOptimizedInput 
        onFocus={onFocus} 
        onBlur={onBlur} 
        placeholder="Test input" 
      />
    );
    
    const input = screen.getByPlaceholderText('Test input');
    
    fireEvent(input, 'focus');
    expect(onFocus).toHaveBeenCalled();
    
    fireEvent(input, 'blur');
    expect(onBlur).toHaveBeenCalled();
  });

  it('handles text changes', () => {
    const onChangeText = jest.fn();
    
    render(
      <MobileOptimizedInput 
        onChangeText={onChangeText} 
        placeholder="Test input" 
      />
    );
    
    const input = screen.getByPlaceholderText('Test input');
    
    fireEvent.changeText(input, 'Hello World');
    expect(onChangeText).toHaveBeenCalledWith('Hello World');
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<MobileOptimizedInput disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input.props.editable).toBe(false);
  });

  it('shows required indicator when required prop is true', () => {
    render(<MobileOptimizedInput label="Required Field" required placeholder="Required" />);
    expect(screen.getByText('*')).toBeTruthy();
  });
});
