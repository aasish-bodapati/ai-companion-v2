import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders correctly with title and subtitle', () => {
    const { getByText } = render(
      <EmptyState 
        title="No data found" 
        subtitle="There are no items to display." 
      />
    );
    
    expect(getByText('No data found')).toBeTruthy();
    expect(getByText('There are no items to display.')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <EmptyState 
        title="No data found" 
        visible={false} 
      />
    );
    
    expect(queryByText('No data found')).toBeNull();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <EmptyState title="No data" size="small" />
    );
    
    rerender(
      <EmptyState title="No data" size="medium" />
    );
    
    rerender(
      <EmptyState title="No data" size="large" />
    );
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <EmptyState title="No data" variant="default" />
    );
    
    rerender(
      <EmptyState title="No data" variant="minimal" />
    );
    
    rerender(
      <EmptyState title="No data" variant="detailed" />
    );
    
    rerender(
      <EmptyState title="No data" variant="actionable" />
    );
  });

  it('renders action button when provided', () => {
    const mockOnActionPress = jest.fn();
    const { getByText } = render(
      <EmptyState 
        title="No data" 
        actionText="Add Item" 
        onActionPress={mockOnActionPress}
      />
    );
    
    expect(getByText('Add Item')).toBeTruthy();
    
    fireEvent.press(getByText('Add Item'));
    expect(mockOnActionPress).toHaveBeenCalled();
  });

  it('hides icon when showIcon is false', () => {
    const { queryByTestId } = render(
      <EmptyState 
        title="No data" 
        showIcon={false} 
      />
    );
    
    expect(queryByTestId('empty-state-icon')).toBeNull();
  });

  it('renders with custom icon', () => {
    const { getByTestId } = render(
      <EmptyState 
        title="No data" 
        icon="fitness-outline" 
      />
    );
    
    expect(getByTestId('empty-state-icon')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <EmptyState 
        title="No data" 
        containerStyle={customStyle}
      />
    );
    
    expect(getByTestId('empty-state-container')).toHaveStyle(customStyle);
  });

  it('renders custom icon component', () => {
    const customIcon = <Text testID="custom-icon">Custom Icon</Text>;
    const { getByTestId } = render(
      <EmptyState 
        title="No data" 
        customIcon={customIcon}
      />
    );
    
    expect(getByTestId('custom-icon')).toBeTruthy();
  });

  it('renders custom action component', () => {
    const customAction = <Text testID="custom-action">Custom Action</Text>;
    const { getByTestId } = render(
      <EmptyState 
        title="No data" 
        actionText="Add Item" 
        onActionPress={() => {}}
        customAction={customAction}
      />
    );
    
    expect(getByTestId('custom-action')).toBeTruthy();
  });
});
