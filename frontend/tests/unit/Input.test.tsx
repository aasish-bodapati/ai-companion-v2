import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../../src/components/ui/input';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('flex', 'h-10', 'w-full');
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text here" />);
    
    const input = screen.getByPlaceholderText('Enter text here');
    expect(input).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test input' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('test input');
  });

  it('renders with different types', () => {
    render(
      <div>
        <Input type="text" data-testid="text-input" />
        <Input type="email" data-testid="email-input" />
        <Input type="password" data-testid="password-input" />
      </div>
    );
    
    expect(screen.getByTestId('text-input')).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} type="text" />);
    
    expect(ref.current).toBeInTheDocument();
    expect(ref.current).toHaveAttribute('type', 'text');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('handles required attribute', () => {
    render(<Input required />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('handles different sizes', () => {
    render(
      <div>
        <Input className="h-8" data-testid="small-input" />
        <Input className="h-10" data-testid="medium-input" />
        <Input className="h-12" data-testid="large-input" />
      </div>
    );
    
    expect(screen.getByTestId('small-input')).toHaveClass('h-8');
    expect(screen.getByTestId('medium-input')).toHaveClass('h-10');
    expect(screen.getByTestId('large-input')).toHaveClass('h-12');
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
});
