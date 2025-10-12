import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Chart from '../Chart';
import ProgressBar from '../ProgressBar';
import { chartConfigs } from '../Chart.utils';
import { progressBarConfigs } from '../ProgressBar.utils';

const mockChartData = [
  { x: 1, y: 10, label: 'Week 1' },
  { x: 2, y: 20, label: 'Week 2' },
  { x: 3, y: 15, label: 'Week 3' },
  { x: 4, y: 25, label: 'Week 4' },
];

describe('Chart and ProgressBar Integration', () => {
  it('renders both components together correctly', () => {
    const { getByTestId } = render(
      <>
        <Chart
          data={mockChartData}
          type="line"
          testID="test-chart"
          {...chartConfigs.fitnessProgress}
        />
        <ProgressBar
          progress={75}
          testID="test-progress-bar"
          {...progressBarConfigs.fitnessGoal}
        />
      </>
    );
    
    expect(getByTestId('test-chart')).toBeTruthy();
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders fitness progress chart with correct configuration', () => {
    const { getByTestId } = render(
      <Chart
        data={mockChartData}
        type="line"
        testID="test-chart"
        {...chartConfigs.fitnessProgress}
      />
    );
    
    expect(getByTestId('test-chart')).toBeTruthy();
  });

  it('renders workout volume chart with correct configuration', () => {
    const { getByTestId } = render(
      <Chart
        data={mockChartData}
        type="bar"
        testID="test-chart"
        {...chartConfigs.workoutVolume}
      />
    );
    
    expect(getByTestId('test-chart')).toBeTruthy();
  });

  it('renders nutrition breakdown chart with correct configuration', () => {
    const { getByTestId } = render(
      <Chart
        data={mockChartData}
        type="pie"
        testID="test-chart"
        {...chartConfigs.nutritionBreakdown}
      />
    );
    
    expect(getByTestId('test-chart')).toBeTruthy();
  });

  it('renders weight tracking chart with correct configuration', () => {
    const { getByTestId } = render(
      <Chart
        data={mockChartData}
        type="line"
        testID="test-chart"
        {...chartConfigs.weightTracking}
      />
    );
    
    expect(getByTestId('test-chart')).toBeTruthy();
  });

  it('renders calories burned chart with correct configuration', () => {
    const { getByTestId } = render(
      <Chart
        data={mockChartData}
        type="area"
        testID="test-chart"
        {...chartConfigs.caloriesBurned}
      />
    );
    
    expect(getByTestId('test-chart')).toBeTruthy();
  });

  it('renders fitness goal progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={75}
        testID="test-progress-bar"
        {...progressBarConfigs.fitnessGoal}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders workout progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={60}
        testID="test-progress-bar"
        {...progressBarConfigs.workoutProgress}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders nutrition goal progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={80}
        testID="test-progress-bar"
        {...progressBarConfigs.nutritionGoal}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders water intake progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={90}
        testID="test-progress-bar"
        {...progressBarConfigs.waterIntake}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders step count progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={85}
        testID="test-progress-bar"
        {...progressBarConfigs.stepCount}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders calories burned progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={70}
        testID="test-progress-bar"
        {...progressBarConfigs.caloriesBurned}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders sleep quality progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={65}
        testID="test-progress-bar"
        {...progressBarConfigs.sleepQuality}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders heart rate progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={55}
        testID="test-progress-bar"
        {...progressBarConfigs.heartRate}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders mood score progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={80}
        testID="test-progress-bar"
        {...progressBarConfigs.moodScore}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders weight loss progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={45}
        testID="test-progress-bar"
        {...progressBarConfigs.weightLoss}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders muscle gain progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={30}
        testID="test-progress-bar"
        {...progressBarConfigs.muscleGain}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders flexibility progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={60}
        testID="test-progress-bar"
        {...progressBarConfigs.flexibility}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders strength progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={75}
        testID="test-progress-bar"
        {...progressBarConfigs.strength}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders endurance progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={40}
        testID="test-progress-bar"
        {...progressBarConfigs.endurance}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders balance progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={85}
        testID="test-progress-bar"
        {...progressBarConfigs.balance}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders coordination progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={70}
        testID="test-progress-bar"
        {...progressBarConfigs.coordination}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders recovery progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={90}
        testID="test-progress-bar"
        {...progressBarConfigs.recovery}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders consistency progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={65}
        testID="test-progress-bar"
        {...progressBarConfigs.consistency}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });

  it('renders motivation progress bar with correct configuration', () => {
    const { getByTestId } = render(
      <ProgressBar
        progress={80}
        testID="test-progress-bar"
        {...progressBarConfigs.motivation}
      />
    );
    
    expect(getByTestId('test-progress-bar')).toBeTruthy();
  });
});
