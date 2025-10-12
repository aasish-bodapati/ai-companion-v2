import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  it('renders correctly when loading is true', () => {
    const { getByText, getByTestId } = render(
      <LoadingState loading={true} message="Loading..." />
    );
    
    expect(getByText('Loading...')).toBeTruthy();
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });

  it('does not render when loading is false', () => {
    const { queryByText } = render(
      <LoadingState loading={false} message="Loading..." />
    );
    
    expect(queryByText('Loading...')).toBeNull();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <LoadingState loading={true} size="small" message="Loading..." />
    );
    
    rerender(
      <LoadingState loading={true} size="medium" message="Loading..." />
    );
    
    rerender(
      <LoadingState loading={true} size="large" message="Loading..." />
    );
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <LoadingState loading={true} variant="default" message="Loading..." />
    );
    
    rerender(
      <LoadingState loading={true} variant="overlay" message="Loading..." />
    );
    
    rerender(
      <LoadingState loading={true} variant="inline" message="Loading..." />
    );
    
    rerender(
      <LoadingState loading={true} variant="button" message="Loading..." />
    );
  });

  it('hides spinner when showSpinner is false', () => {
    const { queryByTestId } = render(
      <LoadingState loading={true} showSpinner={false} message="Loading..." />
    );
    
    expect(queryByTestId('activity-indicator')).toBeNull();
  });

  it('hides message when showMessage is false', () => {
    const { queryByText } = render(
      <LoadingState loading={true} showMessage={false} message="Loading..." />
    );
    
    expect(queryByText('Loading...')).toBeNull();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <LoadingState 
        loading={true} 
        message="Loading..." 
        containerStyle={customStyle}
        testID="loading-state"
      />
    );
    
    expect(getByTestId('loading-state')).toHaveStyle(customStyle);
  });

  it('renders custom spinner', () => {
    const customSpinner = <Text testID="custom-spinner">Custom Spinner</Text>;
    const { getByTestId } = render(
      <LoadingState 
        loading={true} 
        message="Loading..." 
        customSpinner={customSpinner}
      />
    );
    
    expect(getByTestId('custom-spinner')).toBeTruthy();
  });

  it('renders custom message', () => {
    const customMessage = <Text testID="custom-message">Custom Message</Text>;
    const { getByTestId } = render(
      <LoadingState 
        loading={true} 
        message="Loading..." 
        customMessage={customMessage}
      />
    );
    
    expect(getByTestId('custom-message')).toBeTruthy();
  });
});
