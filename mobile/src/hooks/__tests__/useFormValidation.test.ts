/**
 * Tests for the useFormValidation hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useFormValidation } from '../useFormValidation';
import { ValidationRule } from '../../utils/formValidation';

describe('useFormValidation', () => {
  const initialData = {
    name: '',
    email: '',
    age: 0,
  };

  const validationRules: Record<keyof typeof initialData, ValidationRule[]> = {
    name: [
      { required: true, message: 'Name is required' },
      { minLength: 2, message: 'Name must be at least 2 characters' },
    ],
    email: [
      { required: true, message: 'Email is required' },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
    ],
    age: [
      { required: true, message: 'Age is required' },
      { min: 18, message: 'Must be at least 18 years old' },
    ],
  };

  test('initializes with correct state', () => {
    const { result } = renderHook(() => useFormValidation(initialData, validationRules));

    expect(result.current.data).toEqual(initialData);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isValid).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  test('updates field value and validates', () => {
    const { result } = renderHook(() => useFormValidation(initialData, validationRules));

    act(() => {
      result.current.updateField('name', 'John');
    });

    expect(result.current.data.name).toBe('John');
    expect(result.current.errors.name).toBeUndefined();
    expect(result.current.isDirty).toBe(true);
  });

  test('shows validation errors for invalid data', () => {
    const { result } = renderHook(() => useFormValidation(initialData, validationRules));

    act(() => {
      result.current.updateField('name', 'J'); // Too short
    });

    expect(result.current.errors.name).toBe('Name must be at least 2 characters');
    expect(result.current.isValid).toBe(false);
  });

  test('validates email format', () => {
    const { result } = renderHook(() => useFormValidation(initialData, validationRules));

    act(() => {
      result.current.updateField('email', 'invalid-email');
    });

    expect(result.current.errors.email).toBe('Invalid email format');
  });

  test('validates age requirement', () => {
    const { result } = renderHook(() => useFormValidation(initialData, validationRules));

    act(() => {
      result.current.updateField('age', 17);
    });

    expect(result.current.errors.age).toBe('Must be at least 18 years old');
  });

  test('form becomes valid when all fields are correct', () => {
    const { result } = renderHook(() => useFormValidation(initialData, validationRules));

    act(() => {
      result.current.updateField('name', 'John Doe');
      result.current.updateField('email', 'john@example.com');
      result.current.updateField('age', 25);
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  test('resets form to initial state', () => {
    const { result } = renderHook(() => useFormValidation(initialData, validationRules));

    act(() => {
      result.current.updateField('name', 'John Doe');
      result.current.updateField('email', 'john@example.com');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.data).toEqual(initialData);
    expect(result.current.errors).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  test('updates multiple fields at once', () => {
    const { result } = renderHook(() => useFormValidation(initialData, validationRules));

    act(() => {
      result.current.updateFields({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });
    });

    expect(result.current.data).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    });
    expect(result.current.isValid).toBe(true);
  });

  test('clears errors', () => {
    const { result } = renderHook(() => useFormValidation(initialData, validationRules));

    act(() => {
      result.current.updateField('name', 'J');
    });

    expect(result.current.errors.name).toBeDefined();

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
  });

  test('clears specific field error', () => {
    const { result } = renderHook(() => useFormValidation(initialData, validationRules));

    act(() => {
      result.current.updateField('name', 'J');
    });

    expect(result.current.errors.name).toBeDefined();

    act(() => {
      result.current.clearFieldError('name');
    });

    expect(result.current.errors.name).toBeUndefined();
  });
});
