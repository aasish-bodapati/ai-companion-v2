import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemoriesPage from '../page';

// Mock AppLayout to avoid Next layout complexity
jest.mock('@/components/layout/AppLayout', () => {
  return function MockAppLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="app-layout">{children}</div>;
  };
});

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test User' }
  })
}));

// Mock toast to avoid side effects
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

// Mock memory API
const listMyMemoriesMock = jest.fn();
const updateMemoryMock = jest.fn();
const deleteMemoryMock = jest.fn();

jest.mock('@/features/memory/api', () => ({
  listMyMemories: (...args: any[]) => listMyMemoriesMock(...args),
  updateMemory: (...args: any[]) => updateMemoryMock(...args),
  deleteMemory: (...args: any[]) => deleteMemoryMock(...args),
}));


// Mock the ProtectedRoute component
jest.mock('@/components/auth/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>;
  };
});

// Mock the SimplifiedMemoryView component
jest.mock('@/components/memories/SimplifiedMemoryView', () => {
  return function MockSimplifiedMemoryView() {
    return (
      <div data-testid="simplified-memory-view">
        <div>Deduplication Dashboard</div>
        <div>Memory Efficiency: 85%</div>
        <button>Consolidate Memories</button>
      </div>
    );
  };
});

describe('MemoriesPage', () => {
  it('renders the simplified memory management page', () => {
    render(<MemoriesPage />);
    
    expect(screen.getByText('Memory Management')).toBeInTheDocument();
    expect(screen.getByText(/Manage your AI companion's memory with deduplication and efficiency insights/)).toBeInTheDocument();
  });

  it('renders within AppLayout and ProtectedRoute', () => {
    render(<MemoriesPage />);
    
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
  });

  it('renders SimplifiedMemoryView component', () => {
    render(<MemoriesPage />);
    
    expect(screen.getByTestId('simplified-memory-view')).toBeInTheDocument();
    expect(screen.getByText('Deduplication Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Memory Efficiency: 85%')).toBeInTheDocument();
    expect(screen.getByText('Consolidate Memories')).toBeInTheDocument();
  });
});
