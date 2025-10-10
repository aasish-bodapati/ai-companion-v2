import React from 'react';
import { render, screen } from '@testing-library/react-native';
import Badge from '../Badge';

describe('Badge Component', () => {
  it('renders with default props', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText('Primary')).toBeTruthy();

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toBeTruthy();

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Badge size="small">Small</Badge>);
    expect(screen.getByText('Small')).toBeTruthy();

    rerender(<Badge size="medium">Medium</Badge>);
    expect(screen.getByText('Medium')).toBeTruthy();

    rerender(<Badge size="large">Large</Badge>);
    expect(screen.getByText('Large')).toBeTruthy();
  });

  it('renders with outline style', () => {
    render(<Badge outline>Outline Badge</Badge>);
    expect(screen.getByText('Outline Badge')).toBeTruthy();
  });

  it('renders with icon', () => {
    render(<Badge icon="star">With Icon</Badge>);
    expect(screen.getByText('With Icon')).toBeTruthy();
  });

  it('renders as pressable when onPress is provided', () => {
    const mockPress = jest.fn();
    render(<Badge onPress={mockPress}>Pressable</Badge>);
    expect(screen.getByText('Pressable')).toBeTruthy();
  });
});
