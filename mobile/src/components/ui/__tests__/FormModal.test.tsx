import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FormModal from '../FormModal';

// Mock MobileOptimizedModal
jest.mock('../MobileOptimizedModal', () => {
  return function MockMobileOptimizedModal({ children, visible, onClose, title, testID }: any) {
    if (!visible) return null;
    return (
      <div data-testid={testID || 'modal'}>
        <div data-testid="modal-title">{title}</div>
        <button data-testid="modal-close" onClick={onClose}>Close</button>
        {children}
      </div>
    );
  };
});

describe('FormModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div data-testid="modal-content">Test Content</div>,
    testID: 'form-modal',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    const { getByText, getByTestId } = render(<FormModal {...defaultProps} />);
    
    expect(getByText('Test Modal')).toBeTruthy();
    expect(getByTestId('modal-content')).toBeTruthy();
    expect(getByTestId('form-modal')).toBeTruthy();
  });

  it('renders with subtitle', () => {
    const { getByText } = render(
      <FormModal {...defaultProps} subtitle="Test subtitle" />
    );
    
    expect(getByText('Test subtitle')).toBeTruthy();
  });

  it('renders children content', () => {
    const { getByTestId } = render(
      <FormModal {...defaultProps}>
        <div data-testid="custom-content">Custom Content</div>
      </FormModal>
    );
    
    expect(getByTestId('custom-content')).toBeTruthy();
  });

  it('handles close button press', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <FormModal {...defaultProps} onClose={onClose} />
    );
    
    fireEvent.press(getByTestId('modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders primary action button', () => {
    const primaryAction = {
      label: 'Save',
      onPress: jest.fn(),
    };
    
    const { getByText } = render(
      <FormModal {...defaultProps} primaryAction={primaryAction} />
    );
    
    expect(getByText('Save')).toBeTruthy();
  });

  it('renders secondary action button', () => {
    const secondaryAction = {
      label: 'Cancel',
      onPress: jest.fn(),
    };
    
    const { getByText } = render(
      <FormModal {...defaultProps} secondaryAction={secondaryAction} />
    );
    
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('handles primary action press', () => {
    const primaryAction = {
      label: 'Save',
      onPress: jest.fn(),
    };
    
    const { getByText } = render(
      <FormModal {...defaultProps} primaryAction={primaryAction} />
    );
    
    fireEvent.press(getByText('Save'));
    expect(primaryAction.onPress).toHaveBeenCalledTimes(1);
  });

  it('handles secondary action press', () => {
    const secondaryAction = {
      label: 'Cancel',
      onPress: jest.fn(),
    };
    
    const { getByText } = render(
      <FormModal {...defaultProps} secondaryAction={secondaryAction} />
    );
    
    fireEvent.press(getByText('Cancel'));
    expect(secondaryAction.onPress).toHaveBeenCalledTimes(1);
  });

  it('handles async primary action', async () => {
    const primaryAction = {
      label: 'Save',
      onPress: jest.fn().mockResolvedValue(undefined),
    };
    
    const { getByText } = render(
      <FormModal {...defaultProps} primaryAction={primaryAction} />
    );
    
    fireEvent.press(getByText('Save'));
    
    await waitFor(() => {
      expect(primaryAction.onPress).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state for primary action', () => {
    const primaryAction = {
      label: 'Save',
      onPress: jest.fn(),
    };
    
    const { getByText } = render(
      <FormModal {...defaultProps} primaryAction={primaryAction} loading />
    );
    
    expect(getByText('Processing...')).toBeTruthy();
  });

  it('disables primary action when form is invalid', () => {
    const primaryAction = {
      label: 'Save',
      onPress: jest.fn(),
    };
    
    const { getByText } = render(
      <FormModal {...defaultProps} primaryAction={primaryAction} isFormValid={false} />
    );
    
    const button = getByText('Save');
    expect(button.props.disabled).toBe(true);
  });

  it('disables primary action when disabled', () => {
    const primaryAction = {
      label: 'Save',
      onPress: jest.fn(),
      disabled: true,
    };
    
    const { getByText } = render(
      <FormModal {...defaultProps} primaryAction={primaryAction} />
    );
    
    const button = getByText('Save');
    expect(button.props.disabled).toBe(true);
  });

  it('applies different primary action variants', () => {
    const variants = ['primary', 'success', 'warning', 'danger'] as const;
    
    variants.forEach(variant => {
      const primaryAction = {
        label: 'Save',
        onPress: jest.fn(),
        variant,
      };
      
      const { getByText } = render(
        <FormModal {...defaultProps} primaryAction={primaryAction} />
      );
      
      expect(getByText('Save')).toBeTruthy();
    });
  });

  it('applies different secondary action variants', () => {
    const variants = ['outline', 'ghost'] as const;
    
    variants.forEach(variant => {
      const secondaryAction = {
        label: 'Cancel',
        onPress: jest.fn(),
        variant,
      };
      
      const { getByText } = render(
        <FormModal {...defaultProps} secondaryAction={secondaryAction} />
      );
      
      expect(getByText('Cancel')).toBeTruthy();
    });
  });

  it('applies different modal variants', () => {
    const variants = ['default', 'bottomSheet', 'fullScreen', 'centered'] as const;
    
    variants.forEach(variant => {
      const { getByTestId } = render(
        <FormModal {...defaultProps} variant={variant} />
      );
      
      expect(getByTestId('form-modal')).toBeTruthy();
    });
  });

  it('applies different modal sizes', () => {
    const sizes = ['small', 'medium', 'large', 'full'] as const;
    
    sizes.forEach(size => {
      const { getByTestId } = render(
        <FormModal {...defaultProps} size={size} />
      );
      
      expect(getByTestId('form-modal')).toBeTruthy();
    });
  });

  it('hides close button when showCloseButton is false', () => {
    const { queryByTestId } = render(
      <FormModal {...defaultProps} showCloseButton={false} />
    );
    
    expect(queryByTestId('modal-close')).toBeNull();
  });

  it('applies custom styles', () => {
    const customContentStyle = { padding: 20 };
    const customHeaderStyle = { backgroundColor: '#FF0000' };
    const customFooterStyle = { marginTop: 10 };
    
    const { getByTestId } = render(
      <FormModal 
        {...defaultProps} 
        contentStyle={customContentStyle}
        headerStyle={customHeaderStyle}
        footerStyle={customFooterStyle}
      />
    );
    
    expect(getByTestId('form-modal')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByTestId } = render(
      <FormModal {...defaultProps} visible={false} />
    );
    
    expect(queryByTestId('form-modal')).toBeNull();
  });
});
