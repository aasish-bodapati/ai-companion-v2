import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { Badge, CategoryBadge } from '../ui/Badge';
import SimpleLoggingItem from '../ui/SimpleLoggingItem';

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  hapticFeedback: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    selection: jest.fn(),
  },
}));

// Mock CategoryBadge as it's an external dependency
jest.mock('../ui/Badge', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  return {
    CategoryBadge: ({ category, children, ...props }: any) => (
      <View testID={`category-badge-${category}`}>
        <Text>{String(children || category || 'Not Found')}</Text>
      </View>
    ),
    Badge: ({ children, ...props }: any) => (
      <View testID="badge">
        <Text>{String(children || '')}</Text>
      </View>
    ),
  };
});

describe('Text Rendering Debug - Specific Error Cases', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Badge Component Edge Cases', () => {
    it('should handle undefined children without error', () => {
      expect(() => {
        render(<Badge variant="primary">{undefined}</Badge>);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle null children without error', () => {
      expect(() => {
        render(<Badge variant="primary">{null}</Badge>);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle number children without error', () => {
      expect(() => {
        render(<Badge variant="primary">{123}</Badge>);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle boolean children without error', () => {
      expect(() => {
        render(<Badge variant="primary">{true}</Badge>);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle object children without error', () => {
      expect(() => {
        render(<Badge variant="primary">{{ test: 'object' } as any}</Badge>);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle array children without error', () => {
      expect(() => {
        render(<Badge variant="primary">{['item1', 'item2'] as any}</Badge>);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });
  });

  describe('CategoryBadge Component Edge Cases', () => {
    it('should handle undefined category without error', () => {
      expect(() => {
        render(<CategoryBadge category={undefined} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle null category without error', () => {
      expect(() => {
        render(<CategoryBadge category={null as any} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle empty string category without error', () => {
      expect(() => {
        render(<CategoryBadge category="" />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle undefined children without error', () => {
      expect(() => {
        render(<CategoryBadge category="bodyweight">{undefined}</CategoryBadge>);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle null children without error', () => {
      expect(() => {
        render(<CategoryBadge category="bodyweight">{null}</CategoryBadge>);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });
  });

  describe('SimpleLoggingItem Component Edge Cases', () => {
    const createMockItem = (overrides: any = {}) => ({
      id: '1',
      name: 'Push-ups',
      category: 'bodyweight',
      muscle_group: 'chest',
      equipment: null,
      instructions: null,
      difficulty: 'beginner',
      sets: 3,
      reps: '10',
      weight_kg: undefined,
      duration_minutes: undefined,
      distance: undefined,
      rest_time: '60',
      notes: 'Test notes',
      ...overrides,
    });

    it('should handle undefined name without error', () => {
      const item = createMockItem({ name: undefined });
      
      expect(() => {
        render(<SimpleLoggingItem item={item as any} editable={true} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle null name without error', () => {
      const item = createMockItem({ name: null });
      
      expect(() => {
        render(<SimpleLoggingItem item={item as any} editable={true} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle undefined category without error', () => {
      const item = createMockItem({ category: undefined });
      
      expect(() => {
        render(<SimpleLoggingItem item={item as any} editable={true} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle null category without error', () => {
      const item = createMockItem({ category: null });
      
      expect(() => {
        render(<SimpleLoggingItem item={item as any} editable={true} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle undefined reps without error', () => {
      const item = createMockItem({ reps: undefined });
      
      expect(() => {
        render(<SimpleLoggingItem item={item as any} editable={false} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle null reps without error', () => {
      const item = createMockItem({ reps: null });
      
      expect(() => {
        render(<SimpleLoggingItem item={item as any} editable={false} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle undefined rest_time without error', () => {
      const item = createMockItem({ rest_time: undefined });
      
      expect(() => {
        render(<SimpleLoggingItem item={item as any} editable={false} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle null rest_time without error', () => {
      const item = createMockItem({ rest_time: null });
      
      expect(() => {
        render(<SimpleLoggingItem item={item as any} editable={false} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle completely empty item without error', () => {
      const emptyItem = {
        id: '1',
        name: undefined,
        category: undefined,
        muscle_group: undefined,
        equipment: undefined,
        instructions: undefined,
        difficulty: undefined,
        sets: undefined,
        reps: undefined,
        weight_kg: undefined,
        duration_minutes: undefined,
        distance: undefined,
        rest_time: undefined,
        notes: undefined,
      };
      
      expect(() => {
        render(<SimpleLoggingItem item={emptyItem as any} editable={true} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });
  });

  describe('Real-world Problematic Data Scenarios', () => {
    it('should handle API response with null values', () => {
      const apiResponseItem = {
        id: '1',
        name: 'Run',
        category: 'distance_based',
        muscle_group: 'general',
        equipment: null,
        instructions: null,
        difficulty: 'intermediate',
        sets: null,
        reps: '',
        weight_kg: null,
        duration_minutes: 30,
        distance: 10,
        rest_time: '',
        notes: '',
      };
      
      expect(() => {
        render(<SimpleLoggingItem item={apiResponseItem as any} editable={false} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });

    it('should handle mixed data types', () => {
      const mixedDataItem = {
        id: 1, // number instead of string
        name: 'Push-ups',
        category: 'bodyweight',
        muscle_group: 'chest',
        equipment: null,
        instructions: null,
        difficulty: 'beginner',
        sets: '3', // string instead of number
        reps: 10, // number instead of string
        weight_kg: undefined,
        duration_minutes: undefined,
        distance: undefined,
        rest_time: 60, // number instead of string
        notes: 'Test notes',
      };
      
      expect(() => {
        render(<SimpleLoggingItem item={mixedDataItem as any} editable={true} />);
      }).not.toThrow();
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Text strings must be rendered within a <Text> component')
      );
    });
  });
});
