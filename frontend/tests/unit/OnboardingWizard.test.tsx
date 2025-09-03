import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OnboardingWizard from '@/features/onboarding/OnboardingWizard';
import { fetchMyOnboarding, saveMyOnboarding } from '@/features/onboarding/api';

// Mock the API functions
jest.mock('@/features/onboarding/api');
const mockFetchMyOnboarding = fetchMyOnboarding as jest.MockedFunction<typeof fetchMyOnboarding>;
const mockSaveMyOnboarding = saveMyOnboarding as jest.MockedFunction<typeof saveMyOnboarding>;

// Create a test wrapper with QueryClient
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('OnboardingWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders onboarding form with all required fields', async () => {
    mockFetchMyOnboarding.mockResolvedValue(null);
    
    render(<OnboardingWizard />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/onboarding profile/i)).toBeInTheDocument();
    });
    
    expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pronouns/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/topics of interest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/response style/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/memory policy/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily schedule/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fitness goals/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nutrition goals/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/communication style/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/additional preferences/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your life blueprint/i)).toBeInTheDocument();
  });

  it('loads existing profile data', async () => {
    const mockProfile = {
      identity: {
        nickname: 'TestUser',
        pronouns: 'they/them',
        location: 'San Francisco, CA',
      },
      interests: {
        topics: ['AI', 'fitness', 'cooking'],
      },
      communication: {
        responseStyle: 'Concise' as const,
      },
      boundaries: {
        memoryPolicy: 'ImportantOnly' as const,
      },
      daily_schedule: '9-5 work, evening workouts',
      fitness_goals: 'Build strength and endurance',
      nutrition_goals: 'Eat more protein',
      communication_style: 'Direct and encouraging',
      additional_preferences: 'Prefer morning check-ins',
      user_blueprint: 'I wake up at 7 AM and work out for 30 minutes',
    };
    
    mockFetchMyOnboarding.mockResolvedValue(mockProfile);
    
    render(<OnboardingWizard />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('they/them')).toBeInTheDocument();
      expect(screen.getByDisplayValue('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('AI, fitness, cooking')).toBeInTheDocument();
      expect(screen.getByDisplayValue('9-5 work, evening workouts')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Build strength and endurance')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Eat more protein')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Direct and encouraging')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Prefer morning check-ins')).toBeInTheDocument();
      expect(screen.getByDisplayValue('I wake up at 7 AM and work out for 30 minutes')).toBeInTheDocument();
    });
  });

  it('updates form fields when user types', async () => {
    mockFetchMyOnboarding.mockResolvedValue(null);
    
    render(<OnboardingWizard />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    });
    
    const nicknameInput = screen.getByLabelText(/nickname/i);
    fireEvent.change(nicknameInput, { target: { value: 'NewNickname' } });
    
    expect(nicknameInput).toHaveValue('NewNickname');
  });

  it('handles nested field updates correctly', async () => {
    mockFetchMyOnboarding.mockResolvedValue(null);
    
    render(<OnboardingWizard />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/pronouns/i)).toBeInTheDocument();
    });
    
    const pronounsInput = screen.getByLabelText(/pronouns/i);
    fireEvent.change(pronounsInput, { target: { value: 'she/her' } });
    
    expect(pronounsInput).toHaveValue('she/her');
  });

  it('handles select dropdown changes', async () => {
    mockFetchMyOnboarding.mockResolvedValue(null);
    
    render(<OnboardingWizard />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/response style/i)).toBeInTheDocument();
    });
    
    const responseStyleSelect = screen.getByLabelText(/response style/i);
    fireEvent.change(responseStyleSelect, { target: { value: 'Detailed' } });
    
    expect(responseStyleSelect).toHaveValue('Detailed');
  });

  it('saves form data on submit', async () => {
    mockFetchMyOnboarding.mockResolvedValue(null);
    mockSaveMyOnboarding.mockResolvedValue(undefined);
    
    render(<OnboardingWizard />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    });
    
    const nicknameInput = screen.getByLabelText(/nickname/i);
    const submitButton = screen.getByRole('button', { name: /save profile/i });
    
    fireEvent.change(nicknameInput, { target: { value: 'TestUser' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSaveMyOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          identity: expect.objectContaining({
            nickname: 'TestUser',
          }),
        })
      );
    });
  });

  it('shows loading state during save', async () => {
    mockFetchMyOnboarding.mockResolvedValue(null);
    mockSaveMyOnboarding.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(undefined), 100)));
    
    render(<OnboardingWizard />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    });
    
    const submitButton = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('handles topics of interest as comma-separated values', async () => {
    mockFetchMyOnboarding.mockResolvedValue(null);
    
    render(<OnboardingWizard />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/topics of interest/i)).toBeInTheDocument();
    });
    
    const topicsInput = screen.getByLabelText(/topics of interest/i);
    fireEvent.change(topicsInput, { target: { value: 'AI, fitness, cooking' } });
    
    expect(topicsInput).toHaveValue('AI, fitness, cooking');
  });

  it('shows character count for user blueprint', async () => {
    mockFetchMyOnboarding.mockResolvedValue(null);
    
    render(<OnboardingWizard />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/your life blueprint/i)).toBeInTheDocument();
    });
    
    const blueprintTextarea = screen.getByLabelText(/your life blueprint/i);
    fireEvent.change(blueprintTextarea, { target: { value: 'Test blueprint content' } });
    
    expect(screen.getByText(/22 characters/)).toBeInTheDocument();
  });

  it('renders in preferences mode', async () => {
    mockFetchMyOnboarding.mockResolvedValue(null);
    
    render(<OnboardingWizard mode="preferences" />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/profile preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/customize your profile and preferences/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching profile', () => {
    mockFetchMyOnboarding.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(null), 100)));
    
    render(<OnboardingWizard />, { wrapper: createTestWrapper() });
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
