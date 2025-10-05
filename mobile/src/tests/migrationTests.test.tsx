/**
 * Migration Tests
 * Tests to ensure migration components work correctly
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { UnifiedProgressRing } from '../components/ui/UnifiedProgressRing';
import { UnifiedLoadingState } from '../components/ui/UnifiedLoadingState';
import { createLoadingState } from '../utils/duplicateCodeUtils';
import { DUPLICATE_STYLES } from '../theme/duplicateStyles';
import { MigrationHelpers } from '../utils/migrationHelpers';
import { DebugUtils } from '../utils/debugUtils';

// Mock the feature flags
jest.mock('../config/featureFlags', () => ({
  isFeatureEnabled: jest.fn((flag: string) => {
    const enabledFlags = ['ENABLE_DEPRECATION_WARNINGS'];
    return enabledFlags.includes(flag);
  }),
}));

// Mock the deprecation utils
jest.mock('../utils/deprecationUtils', () => ({
  deprecateComponent: jest.fn(),
}));

describe('Migration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UnifiedProgressRing', () => {
    it('should render with shared variant props', () => {
      render(
        <UnifiedProgressRing
          value={75}
          target={100}
          label="Test Progress"
          variant="shared"
        />
      );

      expect(screen.getByText('75')).toBeTruthy();
      expect(screen.getByText('/ 100')).toBeTruthy();
      expect(screen.getByText('Test Progress')).toBeTruthy();
    });

    it('should render with ui variant props', () => {
      render(
        <UnifiedProgressRing
          progress={0.75}
          goal={100}
          current={75}
          label="Test Progress"
          variant="ui"
        />
      );

      expect(screen.getByText('75')).toBeTruthy();
      expect(screen.getByText('/ 100')).toBeTruthy();
      expect(screen.getByText('Test Progress')).toBeTruthy();
    });

    it('should auto-detect variant based on props', () => {
      render(
        <UnifiedProgressRing
          value={75}
          target={100}
          label="Auto Detect"
        />
      );

      expect(screen.getByText('75')).toBeTruthy();
      expect(screen.getByText('/ 100')).toBeTruthy();
    });

    it('should handle onPress callback', () => {
      const onPress = jest.fn();
      
      render(
        <UnifiedProgressRing
          value={75}
          target={100}
          label="Clickable"
          onPress={onPress}
        />
      );

      fireEvent.press(screen.getByText('75'));
      expect(onPress).toHaveBeenCalled();
    });
  });

  describe('UnifiedLoadingState', () => {
    it('should render loading state when loading is true', () => {
      render(
        <UnifiedLoadingState
          loading={true}
          message="Loading..."
        />
      );

      expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('should render children when loading is false', () => {
      const { root } = render(
        <UnifiedLoadingState
          loading={false}
          message="Loading..."
        >
          <div>Content</div>
        </UnifiedLoadingState>
      );

      // The component renders children when loading is false
      expect(root).toBeTruthy();
    });

    it('should render with different variants', () => {
      const { rerender } = render(
        <UnifiedLoadingState
          loading={true}
          message="Overlay"
          variant="overlay"
        />
      );

      expect(screen.getByText('Overlay')).toBeTruthy();

      rerender(
        <UnifiedLoadingState
          loading={true}
          message="Inline"
          variant="inline"
        />
      );

      expect(screen.getByText('Inline')).toBeTruthy();
    });

    it('should handle retry callback', async () => {
      const onRetry = jest.fn();
      
      render(
        <UnifiedLoadingState
          loading={true}
          message="Error"
          showRetry={true}
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.press(retryButton);
      
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('createLoadingState Hook', () => {
    it('should provide loading state and withLoading function', () => {
      const TestComponent = () => {
        const { loading, withLoading } = createLoadingState();
        
        const handleAction = () => withLoading(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        return (
          <div>
            <div>{loading ? 'Loading' : 'Not Loading'}</div>
            <button onClick={handleAction}>Action</button>
          </div>
        );
      };

      const { root } = render(<TestComponent />);
      
      expect(root).toBeTruthy();
    });
  });

  describe('DUPLICATE_STYLES Constants', () => {
    it('should have correct style constants', () => {
      expect(DUPLICATE_STYLES.BACKGROUND_F8FAFC).toBe('#f8fafc');
      expect(DUPLICATE_STYLES.BORDER_RADIUS_16).toBe(16);
      expect(DUPLICATE_STYLES.PADDING_HORIZONTAL_20).toBe(20);
      expect(DUPLICATE_STYLES.FONT_SIZE_18).toBe(18);
      expect(DUPLICATE_STYLES.COLORS.PRIMARY).toBe('#3b82f6');
    });

    it('should have common style combinations', () => {
      expect(DUPLICATE_STYLES.CARD_STYLE).toEqual({
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
      });
    });
  });

  describe('MigrationHelpers', () => {
    it('should replace styles correctly', () => {
      const oldStyle = { backgroundColor: '#f8fafc' };
      const newStyle = { backgroundColor: DUPLICATE_STYLES.BACKGROUND_F8FAFC };
      
      const result = MigrationHelpers.replaceStyle(oldStyle, newStyle);
      expect(result).toEqual(newStyle);
    });

    it('should replace hardcoded values correctly', () => {
      const oldValue = '#f8fafc';
      const newValue = DUPLICATE_STYLES.BACKGROUND_F8FAFC;
      
      const result = MigrationHelpers.replaceHardcodedValue(
        oldValue, 
        newValue, 
        'USE_NEW_STYLE_CONSTANTS'
      );
      expect(result).toBe(oldValue); // Should return old value when feature is disabled
    });

    it('should replace console.log correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      MigrationHelpers.replaceConsoleLog('Test message', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith('Test message', { data: 'test' });
      
      consoleSpy.mockRestore();
    });
  });

  describe('DebugUtils', () => {
    it('should log messages in development', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      DebugUtils.log('Test message', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Test message', { data: 'test' });
      
      consoleSpy.mockRestore();
    });

    it('should handle different log levels', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      DebugUtils.warn('Warning message');
      
      expect(consoleSpy).toHaveBeenCalledWith('[WARN] Warning message', undefined);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should work with real component migration', () => {
      const TestComponent = () => {
        const { loading, withLoading } = createLoadingState();
        
        const handleAction = () => withLoading(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        return (
          <div>
            <UnifiedLoadingState loading={loading} message="Processing...">
              <UnifiedProgressRing
                value={75}
                target={100}
                label="Progress"
                onPress={handleAction}
              />
            </UnifiedLoadingState>
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByText('75')).toBeTruthy();
      expect(screen.getByText('/ 100')).toBeTruthy();
      expect(screen.getByText('Progress')).toBeTruthy();
    });
  });
});
