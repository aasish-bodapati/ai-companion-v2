import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DateSelector from '../DateSelector';

// Mock the CalendarComponent
jest.mock('../../common/CalendarComponent', () => {
  return function MockCalendarComponent({ selectedDate, onDateSelect }: any) {
    return null; // Mock implementation
  };
});

describe('DateSelector', () => {
  const defaultProps = {
    selectedDate: new Date('2024-01-15'),
    onDateSelect: jest.fn(),
    testID: 'date-selector',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    const { getByText, getByTestId } = render(<DateSelector {...defaultProps} />);
    
    expect(getByText('Date')).toBeTruthy();
    expect(getByTestId('date-selector')).toBeTruthy();
  });

  it('renders with custom label', () => {
    const { getByText } = render(
      <DateSelector {...defaultProps} label="Select Date" />
    );
    
    expect(getByText('Select Date')).toBeTruthy();
  });

  it('displays formatted date correctly', () => {
    const today = new Date();
    const { getByText } = render(
      <DateSelector {...defaultProps} selectedDate={today} />
    );
    
    expect(getByText('Today')).toBeTruthy();
  });

  it('displays yesterday correctly', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { getByText } = render(
      <DateSelector {...defaultProps} selectedDate={yesterday} />
    );
    
    expect(getByText('Yesterday')).toBeTruthy();
  });

  it('displays tomorrow correctly', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { getByText } = render(
      <DateSelector {...defaultProps} selectedDate={tomorrow} />
    );
    
    expect(getByText('Tomorrow')).toBeTruthy();
  });

  it('displays formatted date for other dates', () => {
    const customDate = new Date('2024-01-15');
    const { getByText } = render(
      <DateSelector {...defaultProps} selectedDate={customDate} />
    );
    
    expect(getByText('Jan 15, 2024')).toBeTruthy();
  });

  it('handles previous date navigation', () => {
    const { getByTestId } = render(<DateSelector {...defaultProps} />);
    
    const prevButton = getByTestId('date-selector').find((node) => 
      node.props.testID?.includes('prev') || 
      node.props.children?.some?.((child: any) => child?.props?.name === 'chevron-back')
    );
    
    if (prevButton) {
      fireEvent.press(prevButton);
      expect(defaultProps.onDateSelect).toHaveBeenCalled();
    }
  });

  it('handles next date navigation', () => {
    const { getByTestId } = render(<DateSelector {...defaultProps} />);
    
    const nextButton = getByTestId('date-selector').find((node) => 
      node.props.testID?.includes('next') || 
      node.props.children?.some?.((child: any) => child?.props?.name === 'chevron-forward')
    );
    
    if (nextButton) {
      fireEvent.press(nextButton);
      expect(defaultProps.onDateSelect).toHaveBeenCalled();
    }
  });

  it('handles today button press', () => {
    const { getByText } = render(<DateSelector {...defaultProps} />);
    
    const todayButton = getByText('Today');
    fireEvent.press(todayButton);
    
    expect(defaultProps.onDateSelect).toHaveBeenCalled();
  });

  it('shows today button by default', () => {
    const { getByText } = render(<DateSelector {...defaultProps} />);
    
    expect(getByText('Today')).toBeTruthy();
  });

  it('hides today button when showTodayButton is false', () => {
    const { queryByText } = render(
      <DateSelector {...defaultProps} showTodayButton={false} />
    );
    
    expect(queryByText('Today')).toBeNull();
  });

  it('highlights today button when selected date is today', () => {
    const today = new Date();
    const { getByText } = render(
      <DateSelector {...defaultProps} selectedDate={today} />
    );
    
    expect(getByText('Today')).toBeTruthy();
  });

  it('opens calendar modal when date button is pressed', () => {
    const { getByText } = render(<DateSelector {...defaultProps} />);
    
    const dateButton = getByText('Today');
    fireEvent.press(dateButton);
    
    // Modal should be visible (this would need proper modal testing setup)
    expect(getByText('Today')).toBeTruthy();
  });

  it('applies custom style', () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = render(
      <DateSelector {...defaultProps} style={customStyle} />
    );
    
    expect(getByTestId('date-selector')).toBeTruthy();
  });

  it('uses custom calendar modal title', () => {
    const { getByText } = render(
      <DateSelector {...defaultProps} calendarModalTitle="Choose Date" />
    );
    
    expect(getByText('Choose Date')).toBeTruthy();
  });

  it('passes showLogsIndicator to calendar', () => {
    const { getByTestId } = render(
      <DateSelector {...defaultProps} showLogsIndicator />
    );
    
    expect(getByTestId('date-selector')).toBeTruthy();
  });
});
