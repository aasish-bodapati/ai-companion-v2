/**
 * Tests for the refactored WaterService
 * This ensures the refactored service maintains the same API as the original
 */

import { waterService, WaterLog, WaterLogCreate } from '../waterService';

// Mock the API client
jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('WaterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Helper Methods', () => {
    test('mlToOz converts correctly', () => {
      expect(waterService.mlToOz(1000)).toBeCloseTo(33.814, 2);
      expect(waterService.mlToOz(500)).toBeCloseTo(16.907, 2);
    });

    test('ozToMl converts correctly', () => {
      expect(waterService.ozToMl(33.814)).toBeCloseTo(1000, 0);
      expect(waterService.ozToMl(16.907)).toBeCloseTo(500, 0);
    });

    test('getCommonAmounts returns expected structure', () => {
      const amounts = waterService.getCommonAmounts();
      
      expect(amounts).toHaveLength(6);
      expect(amounts[0]).toHaveProperty('label');
      expect(amounts[0]).toHaveProperty('ml');
      expect(amounts[0]).toHaveProperty('oz');
      expect(amounts[0].label).toBe('Small Glass');
      expect(amounts[0].ml).toBe(150);
    });
  });

  describe('API Methods', () => {
    test('getWaterLogs calls correct endpoint', async () => {
      const mockResponse = [{ id: 1, amount_ml: 250 }];
      const { apiClient } = require('../api');
      apiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await waterService.getWaterLogs(7);
      
      expect(apiClient.get).toHaveBeenCalledWith('/health/water-logs?start_date=2024-01-01&end_date=2024-01-08');
      expect(result).toEqual(mockResponse);
    });

    test('createWaterLog calls correct endpoint', async () => {
      const mockLogData: WaterLogCreate = {
        amount_ml: 250,
        log_type: 'manual',
        notes: 'Test log',
      };
      const mockResponse = { id: 1, ...mockLogData };
      const { apiClient } = require('../api');
      apiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await waterService.createWaterLog(mockLogData);
      
      expect(apiClient.post).toHaveBeenCalledWith('/health/water-logs', mockLogData);
      expect(result).toEqual(mockResponse);
    });

    test('getTodaysWaterLogs calls correct endpoint', async () => {
      const mockResponse = [{ id: 1, amount_ml: 250 }];
      const { apiClient } = require('../api');
      apiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await waterService.getTodaysWaterLogs();
      
      expect(apiClient.get).toHaveBeenCalledWith('/health/water-logs?start_date=2024-01-08&end_date=2024-01-08');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Backward Compatibility', () => {
    test('maintains same interface as original WaterService', () => {
      // Check that all original methods exist
      expect(typeof waterService.getWaterLogs).toBe('function');
      expect(typeof waterService.getTodaysWaterLogs).toBe('function');
      expect(typeof waterService.getWaterStats).toBe('function');
      expect(typeof waterService.createWaterLog).toBe('function');
      expect(typeof waterService.quickLogWater).toBe('function');
      expect(typeof waterService.getWaterLog).toBe('function');
      expect(typeof waterService.updateWaterLog).toBe('function');
      expect(typeof waterService.deleteWaterLog).toBe('function');
      expect(typeof waterService.mlToOz).toBe('function');
      expect(typeof waterService.ozToMl).toBe('function');
      expect(typeof waterService.getCommonAmounts).toBe('function');
    });
  });
});
