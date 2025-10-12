import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SearchInput from '../SearchInput';

describe('SearchInput', () => {
  const mockOnChangeText = jest.fn();
  const mockOnSearch = jest.fn();
  const mockOnClear = jest.fn();
  const mockOnFocus = jest.fn();
  const mockOnBlur = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByPlaceholderText } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Search..."
      />
    );
    
    expect(getByPlaceholderText('Search...')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const { getByPlaceholderText } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Search..."
      />
    );
    
    const input = getByPlaceholderText('Search...');
    fireEvent.changeText(input, 'test query');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('test query');
  });

  it('calls onSearch when search button is pressed', () => {
    const { getByTestId } = render(
      <SearchInput
        value="test"
        onChangeText={mockOnChangeText}
        onSearch={mockOnSearch}
        testID="search-input"
      />
    );
    
    const searchButton = getByTestId('search-input-search');
    fireEvent.press(searchButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith('test');
  });

  it('calls onClear when clear button is pressed', () => {
    const { getByTestId } = render(
      <SearchInput
        value="test"
        onChangeText={mockOnChangeText}
        onClear={mockOnClear}
        testID="search-input"
      />
    );
    
    const clearButton = getByTestId('search-input-clear');
    fireEvent.press(clearButton);
    
    expect(mockOnClear).toHaveBeenCalled();
    expect(mockOnChangeText).toHaveBeenCalledWith('');
  });

  it('calls onFocus when input is focused', () => {
    const { getByPlaceholderText } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        onFocus={mockOnFocus}
        placeholder="Search..."
      />
    );
    
    const input = getByPlaceholderText('Search...');
    fireEvent(input, 'focus');
    
    expect(mockOnFocus).toHaveBeenCalled();
  });

  it('calls onBlur when input is blurred', () => {
    const { getByPlaceholderText } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        onBlur={mockOnBlur}
        placeholder="Search..."
      />
    );
    
    const input = getByPlaceholderText('Search...');
    fireEvent(input, 'blur');
    
    expect(mockOnBlur).toHaveBeenCalled();
  });

  it('shows clear button when value is not empty and clearable is true', () => {
    const { getByTestId } = render(
      <SearchInput
        value="test"
        onChangeText={mockOnChangeText}
        clearable={true}
        testID="search-input"
      />
    );
    
    expect(getByTestId('search-input-clear')).toBeTruthy();
  });

  it('hides clear button when value is empty', () => {
    const { queryByTestId } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        clearable={true}
        testID="search-input"
      />
    );
    
    expect(queryByTestId('search-input-clear')).toBeNull();
  });

  it('shows search button when value meets minimum length', () => {
    const { getByTestId } = render(
      <SearchInput
        value="test"
        onChangeText={mockOnChangeText}
        onSearch={mockOnSearch}
        minLength={1}
        testID="search-input"
      />
    );
    
    expect(getByTestId('search-input-search')).toBeTruthy();
  });

  it('hides search button when value is below minimum length', () => {
    const { queryByTestId } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        onSearch={mockOnSearch}
        minLength={1}
        testID="search-input"
      />
    );
    
    expect(queryByTestId('search-input-search')).toBeNull();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <SearchInput value="" onChangeText={mockOnChangeText} size="small" />
    );
    
    rerender(
      <SearchInput value="" onChangeText={mockOnChangeText} size="medium" />
    );
    
    rerender(
      <SearchInput value="" onChangeText={mockOnChangeText} size="large" />
    );
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <SearchInput value="" onChangeText={mockOnChangeText} variant="default" />
    );
    
    rerender(
      <SearchInput value="" onChangeText={mockOnChangeText} variant="minimal" />
    );
    
    rerender(
      <SearchInput value="" onChangeText={mockOnChangeText} variant="filled" />
    );
    
    rerender(
      <SearchInput value="" onChangeText={mockOnChangeText} variant="outlined" />
    );
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        containerStyle={customStyle}
        testID="search-input"
      />
    );
    
    expect(getByTestId('search-input')).toHaveStyle(customStyle);
  });

  it('renders with custom icons', () => {
    const { getByTestId } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        leftIcon="heart-outline"
        rightIcon="star-outline"
        testID="search-input"
      />
    );
    
    expect(getByTestId('search-input')).toBeTruthy();
  });

  it('handles debounced search', async () => {
    const { getByPlaceholderText } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        onSearch={mockOnSearch}
        debounceMs={100}
        minLength={1}
        placeholder="Search..."
      />
    );
    
    const input = getByPlaceholderText('Search...');
    fireEvent.changeText(input, 'test');
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    }, { timeout: 200 });
  });

  it('handles disabled state', () => {
    const { getByPlaceholderText } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        disabled={true}
        placeholder="Search..."
      />
    );
    
    const input = getByPlaceholderText('Search...');
    expect(input.props.editable).toBe(false);
  });

  it('handles autoFocus', () => {
    const { getByPlaceholderText } = render(
      <SearchInput
        value=""
        onChangeText={mockOnChangeText}
        autoFocus={true}
        placeholder="Search..."
      />
    );
    
    const input = getByPlaceholderText('Search...');
    expect(input.props.autoFocus).toBe(true);
  });
});
