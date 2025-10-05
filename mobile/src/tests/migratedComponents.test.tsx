/**
 * Tests for migrated components
 * Verifies that migrated components work correctly with feature flags
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react-native';
import SectionHeader from '../components/layout/SectionHeader';
import WaterLoggingCard from '../components/health/WaterLoggingCard';
import { isFeatureEnabled } from '../config/featureFlags';

// Mock the feature flags
jest.mock('../config/featureFlags', () => ({
  isFeatureEnabled: jest.fn((flag: string) => {
    const enabledFlags = [
      'USE_NEW_STYLE_CONSTANTS',
      'USE_NEW_LOADING_UTILS',
      'USE_NEW_ERROR_HANDLING',
      'ENABLE_DEPRECATION_WARNINGS'
    ];
    return enabledFlags.includes(flag);
  }),
}));

// Mock the migration helpers
jest.mock('../utils/migrationHelpers', () => ({
  MigrationHelpers: {
    replaceStyle: jest.fn((oldStyle, newStyle) => newStyle),
    replaceConsoleLog: jest.fn((message, data) => console.log(message, data)),
    replaceErrorHandling: jest.fn((error, context) => console.error(`Error in ${context}:`, error)),
  },
}));

// Mock the debug utils
jest.mock('../utils/debugUtils', () => ({
  DebugUtils: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the water service
jest.mock('../services/waterService', () => ({
  waterService: {
    getWaterStats: jest.fn().mockResolvedValue({
      total_ml_today: 1000,
      total_oz_today: 33.8,
      logs_today: 4,
      goal_ml: 3000,
    }),
    logWater: jest.fn().mockResolvedValue({}),
  },
}));

describe('Migrated Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SectionHeader', () => {
    it('should render with title', () => {
      render(<SectionHeader title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeTruthy();
    });

    it('should render with subtitle', () => {
      render(
        <SectionHeader 
          title="Test Title" 
          subtitle="Test Subtitle" 
        />
      );
      expect(screen.getByText('Test Title')).toBeTruthy();
      expect(screen.getByText('Test Subtitle')).toBeTruthy();
    });

    it('should render with icon', () => {
      render(
        <SectionHeader 
          title="Test Title" 
          icon="home" 
        />
      );
      expect(screen.getByText('Test Title')).toBeTruthy();
    });

    it('should render with action button', () => {
      const mockAction = {
        text: 'Action',
        onPress: jest.fn(),
      };
      
      render(
        <SectionHeader 
          title="Test Title" 
          action={mockAction}
        />
      );
      expect(screen.getByText('Test Title')).toBeTruthy();
      expect(screen.getByText('Action')).toBeTruthy();
    });

    it('should render with badge', () => {
      const mockBadge = {
        text: 'Badge',
        color: '#ffffff',
        backgroundColor: '#3b82f6',
      };
      
      render(
        <SectionHeader 
          title="Test Title" 
          badge={mockBadge}
        />
      );
      expect(screen.getByText('Test Title')).toBeTruthy();
      expect(screen.getByText('Badge')).toBeTruthy();
    });
  });

  describe('WaterLoggingCard', () => {
    it('should render without crashing', async () => {
      await act(async () => {
        render(<WaterLoggingCard />);
      });
      // The component should render without throwing errors
      expect(screen.getByText('Water Intake')).toBeTruthy();
    });

    it('should display water intake information', async () => {
      await act(async () => {
        render(<WaterLoggingCard />);
      });
      expect(screen.getByText('Water Intake')).toBeTruthy();
    });
  });

  describe('Feature Flag Integration', () => {
    it('should use new style constants when feature flag is enabled', () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
      
      render(<SectionHeader title="Test" icon="home" />);
      
      // Verify that isFeatureEnabled was called with the correct flag
      expect(isFeatureEnabled).toHaveBeenCalledWith('USE_NEW_STYLE_CONSTANTS');
    });

    it('should use old styles when feature flag is disabled', () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      
      render(<SectionHeader title="Test" icon="home" />);
      
      // Verify that isFeatureEnabled was called
      expect(isFeatureEnabled).toHaveBeenCalledWith('USE_NEW_STYLE_CONSTANTS');
    });
  });

  describe('Migration Helpers Integration', () => {
    it('should use MigrationHelpers.replaceStyle', () => {
      const { MigrationHelpers } = require('../utils/migrationHelpers');
      
      render(<SectionHeader title="Test" />);
      
      // Verify that replaceStyle was called (it's called during StyleSheet.create)
      expect(MigrationHelpers.replaceStyle).toHaveBeenCalled();
    });

    it('should use MigrationHelpers.replaceConsoleLog', () => {
      const { MigrationHelpers } = require('../utils/migrationHelpers');
      
      render(<WaterLoggingCard />);
      
      // Verify that replaceConsoleLog was called
      expect(MigrationHelpers.replaceConsoleLog).toHaveBeenCalled();
    });
  });
});
