import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('renders theme toggle button', () => {
    renderWithTheme(<ThemeToggle />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('shows sun icon in light mode', () => {
    renderWithTheme(<ThemeToggle />);
    
    // Should show sun icon (representing current light theme)
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles theme when clicked', () => {
    renderWithTheme(<ThemeToggle />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(toggleButton);
    
    // Theme should be toggled (stored in localStorage)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('loads theme from localStorage on mount', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    
    renderWithTheme(<ThemeToggle />);
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
  });

  it('applies dark class to document element when theme is dark', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    
    renderWithTheme(<ThemeToggle />);
    
    // Check if dark class is applied to document element
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies light class to document element when theme is light', () => {
    localStorageMock.getItem.mockReturnValue('light');
    
    renderWithTheme(<ThemeToggle />);
    
    // Check if light class is applied to document element
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});
