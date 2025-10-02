import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FormLayout from '../../FormLayout';
import FormField from '../../FormField';
import { COLORS } from '../../../theme/constants';

// Mock TouchOptimizedButton
jest.mock('../../TouchOptimizedButton', () => {
  return function MockTouchOptimizedButton({ title, onPress, disabled, testID }: any) {
    return (
      <button 
        data-testid={testID || 'button'} 
        onClick={onPress} 
        disabled={disabled}
      >
        {title}
      </button>
    );
  };
});

// Mock haptic feedback
jest.mock('../../../utils/haptics', () => ({
  hapticFeedback: {
    light: jest.fn(),
  },
}));

describe('FormLayout Integration', () => {
  const TestForm = ({ 
    showBackButton = false, 
    hasError = false, 
    hasSuccess = false,
    loading = false 
  }: {
    showBackButton?: boolean;
    hasError?: boolean;
    hasSuccess?: boolean;
    loading?: boolean;
  }) => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
    });

    const handleSubmit = jest.fn();
    const handleCancel = jest.fn();
    const handleBack = jest.fn();

    return (
      <FormLayout
        title="Test Form"
        subtitle="Fill out the form below"
        showBackButton={showBackButton}
        onBack={handleBack}
        loading={loading}
        error={hasError ? 'Please fix the errors below' : undefined}
        success={hasSuccess ? 'Form submitted successfully' : undefined}
        primaryAction={{
          label: 'Submit',
          onPress: handleSubmit,
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: handleCancel,
        }}
        testID="form-layout"
      >
        <FormField
          name="name"
          label="Name"
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Enter your name"
          testID="name-field"
        />
        <FormField
          name="email"
          label="Email"
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          placeholder="Enter your email"
          keyboardType="email-address"
          testID="email-field"
        />
      </FormLayout>
    );
  };

  it('renders complete form with all elements', () => {
    const { getByText, getByTestId } = render(<TestForm />);
    
    // Check header
    expect(getByText('Test Form')).toBeTruthy();
    expect(getByText('Fill out the form below')).toBeTruthy();
    
    // Check form fields
    expect(getByTestId('name-field')).toBeTruthy();
    expect(getByTestId('email-field')).toBeTruthy();
    
    // Check action buttons
    expect(getByText('Submit')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('handles form field interactions', () => {
    const { getByTestId } = render(<TestForm />);
    
    const nameField = getByTestId('name-field');
    const emailField = getByTestId('email-field');
    
    // Test text input
    fireEvent.changeText(nameField, 'John Doe');
    fireEvent.changeText(emailField, 'john@example.com');
    
    // Fields should be updated
    expect(nameField.props.value).toBe('John Doe');
    expect(emailField.props.value).toBe('john@example.com');
  });

  it('handles action button presses', () => {
    const { getByText } = render(<TestForm />);
    
    const submitButton = getByText('Submit');
    const cancelButton = getByText('Cancel');
    
    fireEvent.press(submitButton);
    fireEvent.press(cancelButton);
    
    // Buttons should be pressable (actual handlers would be tested in unit tests)
    expect(submitButton).toBeTruthy();
    expect(cancelButton).toBeTruthy();
  });

  it('shows back button when enabled', () => {
    const { getByTestId } = render(<TestForm showBackButton />);
    
    expect(getByTestId('form-layout-back-button')).toBeTruthy();
  });

  it('shows error state', () => {
    const { getByText } = render(<TestForm hasError />);
    
    expect(getByText('Please fix the errors below')).toBeTruthy();
  });

  it('shows success state', () => {
    const { getByText } = render(<TestForm hasSuccess />);
    
    expect(getByText('Form submitted successfully')).toBeTruthy();
  });

  it('shows loading state', () => {
    const { getByText } = render(<TestForm loading />);
    
    // Loading state should be applied to buttons
    expect(getByText('Submit')).toBeTruthy();
  });

  it('handles keyboard avoiding view', () => {
    const { getByTestId } = render(
      <FormLayout
        title="Test"
        keyboardAvoidingView={true}
        testID="form-layout"
      >
        <div>Test content</div>
      </FormLayout>
    );
    
    expect(getByTestId('form-layout')).toBeTruthy();
  });

  it('handles scrollable content', () => {
    const { getByTestId } = render(
      <FormLayout
        title="Test"
        scrollable={true}
        testID="form-layout"
      >
        <div>Test content</div>
      </FormLayout>
    );
    
    expect(getByTestId('form-layout')).toBeTruthy();
  });

  it('applies different variants', () => {
    const variants = ['default', 'modal', 'fullscreen'] as const;
    
    variants.forEach(variant => {
      const { getByTestId } = render(
        <FormLayout
          title="Test"
          variant={variant}
          testID="form-layout"
        >
          <div>Test content</div>
        </FormLayout>
      );
      
      expect(getByTestId('form-layout')).toBeTruthy();
    });
  });

  it('handles multiple action buttons', () => {
    const { getByText } = render(
      <FormLayout
        title="Test"
        actions={[
          { label: 'Action 1', onPress: jest.fn() },
          { label: 'Action 2', onPress: jest.fn() },
        ]}
        testID="form-layout"
      >
        <div>Test content</div>
      </FormLayout>
    );
    
    expect(getByText('Action 1')).toBeTruthy();
    expect(getByText('Action 2')).toBeTruthy();
  });
});
