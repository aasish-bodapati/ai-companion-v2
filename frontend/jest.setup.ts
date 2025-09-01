import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  root: Element | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];
  takeRecords() { return []; }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
} as any;
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
} as any;
global.sessionStorage = sessionStorageMock;

// Mock console methods in tests to reduce noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: componentWillReceiveProps') ||
        args[0].includes('Warning: componentWillUpdate'))
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock date for consistent testing
const mockDate = new Date('2024-01-15T10:00:00Z');
global.Date = class extends Date {
  constructor(...args: any[]) {
    if (args.length === 0) {
      super();
    } else {
      super(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
    }
  }
} as any;

// Mock Math.random for consistent testing
const mockRandom = jest.fn(() => 0.5);
global.Math.random = mockRandom;

// Setup test environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';

// Mock environment variables
process.env.NEXT_PUBLIC_APP_NAME = 'AI Companion Test';
process.env.NEXT_PUBLIC_VERSION = '1.0.0';

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock data
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    ...overrides,
  }),
  
  // Helper to create mock conversation
  createMockConversation: (overrides = {}) => ({
    id: 'test-conversation-id',
    title: 'Test Conversation',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
  
  // Helper to create mock message
  createMockMessage: (overrides = {}) => ({
    id: 'test-message-id',
    content: 'Test message content',
    role: 'user',
    timestamp: new Date().toISOString(),
    ...overrides,
  }),
};

// Extend expect matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
      toHaveAccessibleName(name?: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBeVisible(): R;
      toBeHidden(): R;
      toHaveFocus(): R;
      toHaveClass(className: string): R;
      toHaveStyle(css: string | Record<string, any>): R;
    }
  }
  
  var testUtils: {
    waitFor: (ms: number) => Promise<void>;
    createMockUser: (overrides?: any) => any;
    createMockConversation: (overrides?: any) => any;
    createMockMessage: (overrides?: any) => any;
  };
}

export {};
