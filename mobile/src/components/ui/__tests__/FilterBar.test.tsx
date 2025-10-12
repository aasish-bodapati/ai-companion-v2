import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FilterBar from '../FilterBar';

describe('FilterBar', () => {
  const mockOptions = [
    { id: '1', label: 'Option 1', value: 'option1' },
    { id: '2', label: 'Option 2', value: 'option2' },
    { id: '3', label: 'Option 3', value: 'option3' },
  ];

  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with options', () => {
    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );
    
    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
    expect(getByText('Option 3')).toBeTruthy();
  });

  it('calls onSelectionChange when option is pressed', () => {
    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );
    
    fireEvent.press(getByText('Option 1'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('handles multiple selection', () => {
    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={['1']}
        onSelectionChange={mockOnSelectionChange}
        multiple={true}
      />
    );
    
    fireEvent.press(getByText('Option 2'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('handles single selection', () => {
    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        multiple={false}
      />
    );
    
    fireEvent.press(getByText('Option 1'));
    fireEvent.press(getByText('Option 2'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['2']);
  });

  it('handles deselection when allowDeselect is true', () => {
    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={['1']}
        onSelectionChange={mockOnSelectionChange}
        allowDeselect={true}
      />
    );
    
    fireEvent.press(getByText('Option 1'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('does not deselect when allowDeselect is false', () => {
    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={['1']}
        onSelectionChange={mockOnSelectionChange}
        allowDeselect={false}
      />
    );
    
    fireEvent.press(getByText('Option 1'));
    
    expect(mockOnSelectionChange).not.toHaveBeenCalled();
  });

  it('shows clear button when clearable is true and has selections', () => {
    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={['1']}
        onSelectionChange={mockOnSelectionChange}
        clearable={true}
      />
    );
    
    expect(getByText('Clear')).toBeTruthy();
  });

  it('hides clear button when no selections', () => {
    const { queryByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        clearable={true}
      />
    );
    
    expect(queryByText('Clear')).toBeNull();
  });

  it('calls onSelectionChange with empty array when clear is pressed', () => {
    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={['1', '2']}
        onSelectionChange={mockOnSelectionChange}
        clearable={true}
      />
    );
    
    fireEvent.press(getByText('Clear'));
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('respects maxSelections limit', () => {
    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={['1', '2']}
        onSelectionChange={mockOnSelectionChange}
        maxSelections={2}
      />
    );
    
    fireEvent.press(getByText('Option 3'));
    
    expect(mockOnSelectionChange).not.toHaveBeenCalled();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        size="small"
      />
    );
    
    rerender(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        size="medium"
      />
    );
    
    rerender(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        size="large"
      />
    );
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        variant="default"
      />
    );
    
    rerender(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        variant="minimal"
      />
    );
    
    rerender(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        variant="pills"
      />
    );
    
    rerender(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        variant="chips"
      />
    );
  });

  it('renders with different layouts', () => {
    const { rerender } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        layout="horizontal"
      />
    );
    
    rerender(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        layout="vertical"
      />
    );
    
    rerender(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        layout="wrap"
      />
    );
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        containerStyle={customStyle}
        testID="filter-bar"
      />
    );
    
    expect(getByTestId('filter-bar')).toHaveStyle(customStyle);
  });

  it('renders with icons and counts', () => {
    const optionsWithIcons = [
      { id: '1', label: 'Option 1', value: 'option1', icon: 'star-outline' as const, count: 5 },
      { id: '2', label: 'Option 2', value: 'option2', icon: 'heart-outline' as const, count: 3 },
    ];

    const { getByText } = render(
      <FilterBar
        options={optionsWithIcons}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );
    
    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('handles disabled options', () => {
    const optionsWithDisabled = [
      { id: '1', label: 'Option 1', value: 'option1' },
      { id: '2', label: 'Option 2', value: 'option2', disabled: true },
    ];

    const { getByText } = render(
      <FilterBar
        options={optionsWithDisabled}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );
    
    fireEvent.press(getByText('Option 2'));
    
    expect(mockOnSelectionChange).not.toHaveBeenCalled();
  });

  it('renders custom option component', () => {
    const customOption = (option: any, isSelected: boolean, onPress: () => void) => (
      <div key={option.id} onClick={onPress} data-selected={isSelected}>
        Custom {option.label}
      </div>
    );

    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={[]}
        onSelectionChange={mockOnSelectionChange}
        customOption={customOption}
      />
    );
    
    expect(getByText('Custom Option 1')).toBeTruthy();
  });

  it('renders custom clear button', () => {
    const customClearButton = <div>Custom Clear</div>;

    const { getByText } = render(
      <FilterBar
        options={mockOptions}
        selectedValues={['1']}
        onSelectionChange={mockOnSelectionChange}
        customClearButton={customClearButton}
      />
    );
    
    expect(getByText('Custom Clear')).toBeTruthy();
  });
});
