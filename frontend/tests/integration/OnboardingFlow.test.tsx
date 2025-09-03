import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import OnboardingWizard from '@/features/onboarding/OnboardingWizard';

// Mock the API functions
jest.mock('@/features/onboarding/api', () => ({
  fetchMyOnboarding: jest.fn().mockResolvedValue({
    identity: { nickname: '', pronouns: '', location: '' },
    interests: { topics: [] },
    goals: { primaryReason: '' },
    communication: { responseStyle: undefined },
    boundaries: { memoryPolicy: undefined },
    daily_schedule: '',
    schedule_preferences: '',
    fitness_goals: '',
    nutrition_goals: '',
    dietary_preferences: '',
    communication_style: '',
    additional_preferences: '',
    user_blueprint: '',
  }),
  saveMyOnboarding: jest.fn().mockResolvedValue({}),
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

describe('Onboarding Flow Integration', () => {
  beforeEach(() => {
    // Clear any existing localStorage
    localStorage.clear();
  });

  describe('Onboarding Form Rendering', () => {
    it('renders onboarding form with all required fields', async () => {
      render(<OnboardingWizard />, { wrapper: createTestWrapper() });
      
      // Wait for the form to load (it might show loading state first)
      await waitFor(() => {
        expect(screen.getByText(/onboarding profile/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify all form fields are present by their labels
      expect(screen.getByText('Nickname')).toBeInTheDocument();
      expect(screen.getByText('Pronouns')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Topics of Interest')).toBeInTheDocument();
      expect(screen.getByText('Response Style')).toBeInTheDocument();
      expect(screen.getByText('Memory Policy')).toBeInTheDocument();
      expect(screen.getByText('Daily Schedule')).toBeInTheDocument();
      expect(screen.getByText('Fitness Goals')).toBeInTheDocument();
      expect(screen.getByText('Nutrition Goals')).toBeInTheDocument();
      expect(screen.getByText('Communication Style')).toBeInTheDocument();
      expect(screen.getByText('Additional Preferences')).toBeInTheDocument();
      expect(screen.getByText('Your Life Blueprint')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
    });

    it('fills form fields correctly', async () => {
      render(<OnboardingWizard />, { wrapper: createTestWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/onboarding profile/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Find inputs by their placeholder text or by finding inputs near labels
      const nicknameInput = screen.getByPlaceholderText('Optional');
      const pronounsInput = screen.getByPlaceholderText('e.g., she/her, he/him, they/them');
      const locationInput = screen.getByPlaceholderText('City, Country');
      const topicsInput = screen.getByPlaceholderText('AI, startups, design');
      
      fireEvent.change(nicknameInput, { target: { value: 'TestUser' } });
      fireEvent.change(pronounsInput, { target: { value: 'they/them' } });
      fireEvent.change(locationInput, { target: { value: 'San Francisco, CA' } });
      fireEvent.change(topicsInput, { target: { value: 'AI, fitness, cooking' } });
      
      // Verify values are set
      expect(nicknameInput).toHaveValue('TestUser');
      expect(pronounsInput).toHaveValue('they/them');
      expect(locationInput).toHaveValue('San Francisco, CA');
      expect(topicsInput).toHaveValue('AI, fitness, cooking');
    });
  });

  describe('Form Validation', () => {
    it('allows form submission without validation errors', async () => {
      render(<OnboardingWizard />, { wrapper: createTestWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/onboarding profile/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      const submitButton = screen.getByRole('button', { name: /save profile/i });
      
      // The form should allow submission (no client-side validation implemented)
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);
      
      // Should show loading state when submitting
      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });
    });
  });

  describe('Topics of Interest Handling', () => {
    it('handles comma-separated topics input', async () => {
      render(<OnboardingWizard />, { wrapper: createTestWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/onboarding profile/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      const topicsInput = screen.getByPlaceholderText('AI, startups, design');
      fireEvent.change(topicsInput, { target: { value: 'AI, fitness, cooking, technology' } });
      
      // Verify the value is set correctly
      expect(topicsInput).toHaveValue('AI, fitness, cooking, technology');
    });

    it('handles empty topics input', async () => {
      render(<OnboardingWizard />, { wrapper: createTestWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/onboarding profile/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      const topicsInput = screen.getByPlaceholderText('AI, startups, design');
      fireEvent.change(topicsInput, { target: { value: '' } });
      
      // Verify empty value is handled
      expect(topicsInput).toHaveValue('');
    });
  });

  describe('Character Count and Blueprint', () => {
    it('updates character count as user types', async () => {
      render(<OnboardingWizard />, { wrapper: createTestWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/onboarding profile/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Find the blueprint textarea by its placeholder text
      const blueprintTextarea = screen.getByPlaceholderText(/Example blueprint:/i);
      
      // Initial count should be 0
      expect(screen.getByText(/0 characters/)).toBeInTheDocument();
      
      // Type some content
      fireEvent.change(blueprintTextarea, { target: { value: 'Test content' } });
      expect(screen.getByText(/12 characters/)).toBeInTheDocument();
      
      // Add more content
      fireEvent.change(blueprintTextarea, { target: { value: 'Test content with more text' } });
      
      // The text "Test content with more text" is actually 27 characters, not 28
      expect(screen.getByText(/27 characters/)).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('renders in preferences mode with different title', async () => {
      render(<OnboardingWizard mode="preferences" />, { wrapper: createTestWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/profile preferences/i)).toBeInTheDocument();
        expect(screen.getByText(/customize your profile and preferences/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Context Integration', () => {
    it('provides auth context to onboarding component', async () => {
      render(<OnboardingWizard />, { wrapper: createTestWrapper() });
      
      // Wait for the component to load and verify it renders without errors
      await waitFor(() => {
        expect(screen.getByText(/onboarding profile/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('provides theme context to onboarding component', async () => {
      render(<OnboardingWizard />, { wrapper: createTestWrapper() });
      
      // Wait for the component to load and verify it renders without errors
      await waitFor(() => {
        expect(screen.getByText(/onboarding profile/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});
