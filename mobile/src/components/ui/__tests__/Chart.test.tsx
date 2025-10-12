import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Chart from '../Chart';
import { ChartDataPoint } from '../Chart';

const mockData: ChartDataPoint[] = [
  { x: 1, y: 10, label: 'Point 1' },
  { x: 2, y: 20, label: 'Point 2' },
  { x: 3, y: 15, label: 'Point 3' },
  { x: 4, y: 25, label: 'Point 4' },
];

describe('Chart Component', () => {
  it('renders correctly with basic props', () => {
    const { getByTestId } = render(
      <Chart
        data={mockData}
        type="line"
        testID="test-chart"
      />
    );
    
    expect(getByTestId('test-chart')).toBeTruthy();
  });

  it('renders with title when provided', () => {
    const { getByText } = render(
      <Chart
        data={mockData}
        type="line"
        title="Test Chart"
      />
    );
    
    expect(getByText('Test Chart')).toBeTruthy();
  });

  it('renders data points for line chart', () => {
    const { getByTestId } = render(
      <Chart
        data={mockData}
        type="line"
        testID="test-chart"
      />
    );
    
    expect(getByTestId('test-chart-data-point-0')).toBeTruthy();
    expect(getByTestId('test-chart-data-point-1')).toBeTruthy();
    expect(getByTestId('test-chart-data-point-2')).toBeTruthy();
    expect(getByTestId('test-chart-data-point-3')).toBeTruthy();
  });

  it('renders bars for bar chart', () => {
    const { getByTestId } = render(
      <Chart
        data={mockData}
        type="bar"
        testID="test-chart"
      />
    );
    
    expect(getByTestId('test-chart-bar-0')).toBeTruthy();
    expect(getByTestId('test-chart-bar-1')).toBeTruthy();
    expect(getByTestId('test-chart-bar-2')).toBeTruthy();
    expect(getByTestId('test-chart-bar-3')).toBeTruthy();
  });

  it('renders pie slices for pie chart', () => {
    const { getByTestId } = render(
      <Chart
        data={mockData}
        type="pie"
        testID="test-chart"
      />
    );
    
    expect(getByTestId('test-chart-pie-slice-0')).toBeTruthy();
    expect(getByTestId('test-chart-pie-slice-1')).toBeTruthy();
    expect(getByTestId('test-chart-pie-slice-2')).toBeTruthy();
    expect(getByTestId('test-chart-pie-slice-3')).toBeTruthy();
  });

  it('calls onDataPointPress when data point is pressed', () => {
    const onDataPointPress = jest.fn();
    const { getByTestId } = render(
      <Chart
        data={mockData}
        type="line"
        onDataPointPress={onDataPointPress}
        testID="test-chart"
      />
    );
    
    fireEvent.press(getByTestId('test-chart-data-point-0'));
    expect(onDataPointPress).toHaveBeenCalledWith(mockData[0], 0);
  });

  it('renders legend when showLegend is true', () => {
    const { getByTestId } = render(
      <Chart
        data={mockData}
        type="line"
        showLegend={true}
        testID="test-chart"
      />
    );
    
    expect(getByTestId('test-chart-legend-item-0')).toBeTruthy();
    expect(getByTestId('test-chart-legend-item-1')).toBeTruthy();
    expect(getByTestId('test-chart-legend-item-2')).toBeTruthy();
    expect(getByTestId('test-chart-legend-item-3')).toBeTruthy();
  });

  it('renders labels when showLabels is true', () => {
    const { getByText } = render(
      <Chart
        data={mockData}
        type="line"
        showLabels={true}
      />
    );
    
    expect(getByText('Point 1')).toBeTruthy();
    expect(getByText('Point 2')).toBeTruthy();
    expect(getByText('Point 3')).toBeTruthy();
    expect(getByText('Point 4')).toBeTruthy();
  });

  it('renders axis labels when provided', () => {
    const { getByText } = render(
      <Chart
        data={mockData}
        type="line"
        xAxisLabel="X Axis"
        yAxisLabel="Y Axis"
      />
    );
    
    expect(getByText('X Axis')).toBeTruthy();
    expect(getByText('Y Axis')).toBeTruthy();
  });

  it('handles empty data gracefully', () => {
    const { getByTestId } = render(
      <Chart
        data={[]}
        type="line"
        testID="test-chart"
      />
    );
    
    expect(getByTestId('test-chart')).toBeTruthy();
  });

  it('applies custom colors correctly', () => {
    const customData = mockData.map((point, index) => ({
      ...point,
      color: index % 2 === 0 ? '#ff0000' : '#00ff00',
    }));

    const { getByTestId } = render(
      <Chart
        data={customData}
        type="line"
        testID="test-chart"
      />
    );
    
    expect(getByTestId('test-chart')).toBeTruthy();
  });

  it('renders different chart types correctly', () => {
    const chartTypes = ['line', 'bar', 'pie', 'area', 'scatter'] as const;
    
    chartTypes.forEach(type => {
      const { getByTestId } = render(
        <Chart
          data={mockData}
          type={type}
          testID={`test-chart-${type}`}
        />
      );
      
      expect(getByTestId(`test-chart-${type}`)).toBeTruthy();
    });
  });

  it('applies different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const { getByTestId } = render(
        <Chart
          data={mockData}
          type="line"
          size={size}
          testID={`test-chart-${size}`}
        />
      );
      
      expect(getByTestId(`test-chart-${size}`)).toBeTruthy();
    });
  });

  it('applies different variants correctly', () => {
    const variants = ['default', 'minimal', 'filled', 'outlined'] as const;
    
    variants.forEach(variant => {
      const { getByTestId } = render(
        <Chart
          data={mockData}
          type="line"
          variant={variant}
          testID={`test-chart-${variant}`}
        />
      );
      
      expect(getByTestId(`test-chart-${variant}`)).toBeTruthy();
    });
  });
});
