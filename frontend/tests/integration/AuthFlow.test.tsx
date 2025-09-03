import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

// Mock the authentication functions
const mockLogin = jest.fn().mockResolvedValue(true);
const mockRegister = jest.fn().mockResolvedValue(true);

jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

// Create a test wrapper with all providers
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    // Clear any existing localStorage
    localStorage.clear();
  });

  describe('Login Flow', () => {
    it('renders login form with all required fields', async () => {
      render(<LoginForm />, { wrapper: createTestWrapper() });
      
      // Verify form elements are present
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument(); // Exact match
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('allows form submission without client-side validation', async () => {
      render(<LoginForm />, { wrapper: createTestWrapper() });
      
      // Fill in the form fields
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
      
      // The form should allow submission
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);
      
      // Should show loading state when submitting
      await waitFor(() => {
        expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
      });
    });

    it('fills form fields correctly', async () => {
      render(<LoginForm />, { wrapper: createTestWrapper() });
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      // Fill in the form
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // Verify values are set
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Registration Flow', () => {
    it('renders registration form with all required fields', async () => {
      render(<RegisterForm />, { wrapper: createTestWrapper() });
      
      // Verify form elements are present
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument(); // Exact match for "Password"
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });

    it('fills registration form fields correctly', async () => {
      render(<RegisterForm />, { wrapper: createTestWrapper() });
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i); // Exact match
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      // Verify values are set correctly
      expect(emailInput).toHaveValue('newuser@example.com');
      expect(passwordInput).toHaveValue('password123');
      expect(confirmPasswordInput).toHaveValue('password123');
    });
  });

  describe('Navigation Between Auth Forms', () => {
    it('has correct link to register page from login', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() });
      
      const registerLink = screen.getByText(/create an account/i);
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    });

    it('has correct link to login page from register', () => {
      render(<RegisterForm />, { wrapper: createTestWrapper() });
      
      const loginLink = screen.getByText(/sign in/i);
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });
  });

  describe('Form Validation', () => {
    it('allows form submission without client-side validation', async () => {
      render(<RegisterForm />, { wrapper: createTestWrapper() });
      
      // Fill in the form fields
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i); // Exact match for "Password"
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const termsCheckbox = screen.getByLabelText(/i agree to the/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'testpassword123' } });
      fireEvent.click(termsCheckbox);
      
      // The form should allow submission
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);
      
      // Should show loading state when submitting
      await waitFor(() => {
        expect(screen.getByText(/creating account\.\.\./i)).toBeInTheDocument();
      });
    });

    it('shows password length hint', async () => {
      render(<RegisterForm />, { wrapper: createTestWrapper() });
      
      // The form should show the password length hint
      expect(screen.getByText(/must be at least 8 characters long/i)).toBeInTheDocument();
    });
  });

  describe('Context Integration', () => {
    it('provides auth context to components', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() });
      
      // Verify the component renders without errors (context is available)
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('provides theme context to components', () => {
      render(<LoginForm />, { wrapper: createTestWrapper() });
      
      // Verify the component renders without errors (theme context is available)
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
  });
});
