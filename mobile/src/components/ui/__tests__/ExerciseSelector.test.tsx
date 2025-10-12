import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ExerciseSelector, { exerciseSelectorConfigs } from '../ExerciseSelector';
import { Exercise } from '../ExerciseSelector';

const mockExercises: Exercise[] = [
  {
    id: 1,
    name: 'Push-ups',
    category: 'Strength',
    difficulty: 'Beginner',
    calories_per_minute: 8,
    description: 'A basic bodyweight exercise',
  },
  {
    id: 2,
    name: 'Squats',
    category: 'Strength',
    difficulty: 'Beginner',
    calories_per_minute: 10,
    description: 'A fundamental lower body exercise',
  },
  {
    id: 3,
    name: 'Running',
    category: 'Cardio',
    difficulty: 'Intermediate',
    calories_per_minute: 15,
    description: 'Aerobic exercise',
  },
];

describe('ExerciseSelector', () => {
  it('renders correctly when visible', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    
    const { getByText, getByPlaceholderText } = render(
      <ExerciseSelector
        visible={true}
        onClose={onClose}
        onSelect={onSelect}
        exercises={mockExercises}
      />
    );
    
    expect(getByPlaceholderText('Search exercises...')).toBeTruthy();
    expect(getByText('Push-ups')).toBeTruthy();
    expect(getByText('Squats')).toBeTruthy();
    expect(getByText('Running')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    
    const { queryByText } = render(
      <ExerciseSelector
        visible={false}
        onClose={onClose}
        onSelect={onSelect}
        exercises={mockExercises}
      />
    );
    
    expect(queryByText('Push-ups')).toBeNull();
  });

  it('calls onSelect when exercise is pressed', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    
    const { getByText } = render(
      <ExerciseSelector
        visible={true}
        onClose={onClose}
        onSelect={onSelect}
        exercises={mockExercises}
      />
    );
    
    const pushUpButton = getByText('Push-ups');
    fireEvent.press(pushUpButton);
    
    expect(onSelect).toHaveBeenCalledWith(mockExercises[0]);
  });

  it('filters exercises by search query', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    
    const { getByPlaceholderText, queryByText, getByText } = render(
      <ExerciseSelector
        visible={true}
        onClose={onClose}
        onSelect={onSelect}
        exercises={mockExercises}
      />
    );
    
    const searchInput = getByPlaceholderText('Search exercises...');
    fireEvent.changeText(searchInput, 'push');
    
    expect(getByText('Push-ups')).toBeTruthy();
    expect(queryByText('Squats')).toBeNull();
    expect(queryByText('Running')).toBeNull();
  });

  it('filters exercises by category', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    
    const { getByText, queryByText } = render(
      <ExerciseSelector
        visible={true}
        onClose={onClose}
        onSelect={onSelect}
        exercises={mockExercises}
        showCategories={true}
      />
    );
    
    const strengthButton = getByText('Strength');
    fireEvent.press(strengthButton);
    
    expect(getByText('Push-ups')).toBeTruthy();
    expect(getByText('Squats')).toBeTruthy();
    expect(queryByText('Running')).toBeNull();
  });

  it('shows selected state for multiple selection', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const onMultipleSelect = jest.fn();
    
    const { getByText } = render(
      <ExerciseSelector
        visible={true}
        onClose={onClose}
        onSelect={onSelect}
        onMultipleSelect={onMultipleSelect}
        allowMultiple={true}
        selectedExercises={[mockExercises[0]]}
        exercises={mockExercises}
      />
    );
    
    // Should show checkmark for selected exercise
    expect(getByText('Push-ups')).toBeTruthy();
  });

  it('applies exercise selector configs correctly', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    
    const { getByText } = render(
      <ExerciseSelector
        visible={true}
        onClose={onClose}
        onSelect={onSelect}
        exercises={mockExercises}
        {...exerciseSelectorConfigs.workoutLogging}
      />
    );
    
    expect(getByText('Push-ups')).toBeTruthy();
  });

  it('shows empty state when no exercises match filter', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    
    const { getByText, getByPlaceholderText } = render(
      <ExerciseSelector
        visible={true}
        onClose={onClose}
        onSelect={onSelect}
        exercises={mockExercises}
      />
    );
    
    const searchInput = getByPlaceholderText('Search exercises...');
    fireEvent.changeText(searchInput, 'nonexistent');
    
    expect(getByText('No exercises found')).toBeTruthy();
  });

  it('shows loading state', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    
    const { getByText } = render(
      <ExerciseSelector
        visible={true}
        onClose={onClose}
        onSelect={onSelect}
        exercises={[]}
        loading={true}
      />
    );
    
    expect(getByText('Loading exercises...')).toBeTruthy();
  });
});
