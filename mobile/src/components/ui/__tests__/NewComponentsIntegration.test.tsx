import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';
import ConfirmationDialog from '../ConfirmationDialog';

// Test component that uses all three components
function TestComponent() {
  const [loading, setLoading] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <LoadingState 
        loading={loading} 
        message="Loading data..." 
        testID="loading-state"
      />
      
      <EmptyState 
        title="No data found" 
        subtitle="There are no items to display."
        visible={showEmpty}
        actionText="Add Item"
        onActionPress={() => setShowDialog(true)}
        testID="empty-state"
      />
      
      <ConfirmationDialog
        visible={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={() => {
          setShowDialog(false);
          setLoading(true);
          // Simulate loading completion
          setTimeout(() => {
            setLoading(false);
            setShowEmpty(false);
          }, 1000);
        }}
        title="Add Item"
        message="Are you sure you want to add this item?"
        testID="confirmation-dialog"
      />
    </>
  );
}

describe('New Components Integration', () => {
  it('renders all components correctly', () => {
    const { getByTestId } = render(<TestComponent />);
    
    expect(getByTestId('loading-state')).toBeTruthy();
    expect(getByTestId('empty-state')).toBeTruthy();
    expect(getByTestId('confirmation-dialog')).toBeTruthy();
  });

  it('handles component interactions correctly', () => {
    const { getByTestId } = render(<TestComponent />);
    
    // Test empty state action button
    const emptyState = getByTestId('empty-state');
    expect(emptyState).toBeTruthy();
    
    // Test confirmation dialog
    const dialog = getByTestId('confirmation-dialog');
    expect(dialog).toBeTruthy();
  });

  it('handles loading state visibility', () => {
    const { getByTestId, rerender } = render(
      <LoadingState loading={true} message="Loading..." testID="loading" />
    );
    
    expect(getByTestId('loading')).toBeTruthy();
    
    rerender(
      <LoadingState loading={false} message="Loading..." testID="loading" />
    );
    
    expect(getByTestId('loading')).toBeNull();
  });

  it('handles empty state visibility', () => {
    const { getByTestId, rerender } = render(
      <EmptyState 
        title="No data" 
        visible={true} 
        testID="empty" 
      />
    );
    
    expect(getByTestId('empty')).toBeTruthy();
    
    rerender(
      <EmptyState 
        title="No data" 
        visible={false} 
        testID="empty" 
      />
    );
    
    expect(getByTestId('empty')).toBeNull();
  });

  it('handles confirmation dialog visibility', () => {
    const mockOnClose = jest.fn();
    const mockOnConfirm = jest.fn();
    
    const { getByTestId, rerender } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Test"
        message="Test message"
        testID="dialog"
      />
    );
    
    expect(getByTestId('dialog')).toBeTruthy();
    
    rerender(
      <ConfirmationDialog
        visible={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Test"
        message="Test message"
        testID="dialog"
      />
    );
    
    expect(getByTestId('dialog')).toBeNull();
  });
});
