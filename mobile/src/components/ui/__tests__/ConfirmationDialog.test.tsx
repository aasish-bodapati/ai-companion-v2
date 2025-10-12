import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ConfirmationDialog from '../ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with title and message', () => {
    const { getByText } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
      />
    );
    
    expect(getByText('Delete Item')).toBeTruthy();
    expect(getByText('Are you sure you want to delete this item?')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <ConfirmationDialog
        visible={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
      />
    );
    
    expect(queryByText('Delete Item')).toBeNull();
  });

  it('calls onConfirm when confirm button is pressed', () => {
    const { getByText } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
      />
    );
    
    fireEvent.press(getByText('Confirm'));
    expect(mockOnConfirm).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
      />
    );
    
    fireEvent.press(getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is pressed and onCancel is not provided', () => {
    const { getByText } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
      />
    );
    
    fireEvent.press(getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        variant="default"
      />
    );
    
    rerender(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        variant="danger"
      />
    );
    
    rerender(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        variant="warning"
      />
    );
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        size="small"
      />
    );
    
    rerender(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        size="medium"
      />
    );
    
    rerender(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        size="large"
      />
    );
  });

  it('hides cancel button when showCancel is false', () => {
    const { queryByText } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        showCancel={false}
      />
    );
    
    expect(queryByText('Cancel')).toBeNull();
  });

  it('renders with custom button text', () => {
    const { getByText } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Keep"
      />
    );
    
    expect(getByText('Delete')).toBeTruthy();
    expect(getByText('Keep')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        containerStyle={customStyle}
      />
    );
    
    expect(getByTestId('confirmation-dialog-container')).toHaveStyle(customStyle);
  });

  it('renders with custom icons', () => {
    const { getByTestId } = render(
      <ConfirmationDialog
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        confirmIcon="trash-outline"
        cancelIcon="close-outline"
      />
    );
    
    expect(getByTestId('confirmation-dialog-confirm-icon')).toBeTruthy();
    expect(getByTestId('confirmation-dialog-cancel-icon')).toBeTruthy();
  });
});
