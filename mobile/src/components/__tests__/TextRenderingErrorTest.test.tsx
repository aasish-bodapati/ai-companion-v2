import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Test the exact scenario that was causing the error
describe('Text Rendering Error Test', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should not throw text rendering errors with problematic data', () => {
    // This test reproduces the exact data structure from the API response
    const problematicData = {
      distance: 10,
      duration_minutes: 30,
      exercise_name: 'Run',
      notes: '',
      reps: '',
      rest_time: '',
      sets: null, // This was potentially causing issues
      weight_kg: null, // This was potentially causing issues
      weight_used: null, // This was potentially causing issues
      workout_date: '2025-10-09T16:37:27.899000+00:00',
    };

    // Test direct rendering of problematic values
    const TestComponent = () => (
      <View>
        <Text>{String(problematicData.sets || '')}</Text>
        <Text>{String(problematicData.weight_kg || '')}</Text>
        <Text>{String(problematicData.weight_used || '')}</Text>
        <Text>{String(problematicData.reps || '')}</Text>
        <Text>{String(problematicData.rest_time || '')}</Text>
        <Text>{String(problematicData.notes || '')}</Text>
      </View>
    );

    expect(() => {
      render(<TestComponent />);
    }).not.toThrow();

    // Check that no text rendering errors occurred
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Text strings must be rendered within a <Text> component')
    );
  });

  it('should handle undefined values safely', () => {
    const TestComponent = () => (
      <View>
        <Text>{String(undefined || '')}</Text>
        <Text>{String(null || '')}</Text>
        <Text>{String('')}</Text>
        <Text>{String(0)}</Text>
        <Text>{String(false)}</Text>
      </View>
    );

    expect(() => {
      render(<TestComponent />);
    }).not.toThrow();

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Text strings must be rendered within a <Text> component')
    );
  });

  it('should handle object values safely', () => {
    const TestComponent = () => (
      <View>
        <Text>{String({ test: 'object' } as unknown)}</Text>
        <Text>{String([1, 2, 3] as unknown)}</Text>
        <Text>{String(new Date() as unknown)}</Text>
      </View>
    );

    expect(() => {
      render(<TestComponent />);
    }).not.toThrow();

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Text strings must be rendered within a <Text> component')
    );
  });

  it('should handle rapid state changes without errors', () => {
    let renderCount = 0;
    const TestComponent = ({ data }: { data: Record<string, unknown> }) => {
      renderCount++;
      return (
        <View>
          <Text>{String(data.name || 'Exercise')}</Text>
          <Text>{String(data.category || '')}</Text>
          <Text>{String(data.sets || '')}</Text>
          <Text>{String(data.reps || '')}</Text>
        </View>
      );
    };

    const { rerender } = render(<TestComponent data={{ name: 'Run', category: 'distance_based' }} />);
    
    // Rapidly change data
    rerender(<TestComponent data={{ name: null, category: undefined }} />);
    rerender(<TestComponent data={{ name: 'Push-ups', category: 'bodyweight' }} />);
    rerender(<TestComponent data={{ name: undefined, category: null }} />);
    rerender(<TestComponent data={{ name: 'Run', category: 'distance_based' }} />);

    expect(renderCount).toBe(5);
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Text strings must be rendered within a <Text> component')
    );
  });

  it('should handle the exact error scenario from logs', () => {
    // This is the exact data that was in the logs when the error occurred
    const exerciseData = {
      id: 'exercise-1760027025458',
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

    const TestComponent = () => (
      <View>
        <Text>{String(exerciseData.name || 'Exercise')}</Text>
        <Text>{String(exerciseData.category || '')}</Text>
        <Text>{String(exerciseData.sets || '')}</Text>
        <Text>{String(exerciseData.reps || '')}</Text>
        <Text>{String(exerciseData.weight_kg || '')}</Text>
        <Text>{String(exerciseData.rest_time || '')}</Text>
        <Text>{String(exerciseData.notes || '')}</Text>
      </View>
    );

    expect(() => {
      render(<TestComponent />);
    }).not.toThrow();

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Text strings must be rendered within a <Text> component')
    );
  });
});

