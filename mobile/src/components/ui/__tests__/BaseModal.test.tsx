import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import BaseModal from '../BaseModal';
import { modalConfigs } from '../../../test-utils/testConfigs';

describe('BaseModal', () => {
  it('renders correctly when visible', () => {
    const { getByText } = render(
      <BaseModal
        visible={true}
        onClose={() => {}}
        title="Test Modal"
      >
        <Text>Modal Content</Text>
      </BaseModal>
    );
    
    expect(getByText('Test Modal')).toBeTruthy();
    expect(getByText('Modal Content')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <BaseModal
        visible={false}
        onClose={() => {}}
        title="Test Modal"
      >
        <Text>Modal Content</Text>
      </BaseModal>
    );
    
    expect(queryByText('Test Modal')).toBeNull();
    expect(queryByText('Modal Content')).toBeNull();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <BaseModal
        visible={true}
        onClose={onClose}
        title="Test Modal"
        showCloseButton={true}
      >
        <Text>Modal Content</Text>
      </BaseModal>
    );
    
    const closeButton = getByLabelText('Close modal');
    fireEvent.press(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('applies modal presets correctly', () => {
    const { getByText } = render(
      <BaseModal
        visible={true}
        onClose={() => {}}
        title="Test Modal"
        {...modalConfigs.workoutLogging}
      >
        <Text>Modal Content</Text>
      </BaseModal>
    );
    
    expect(getByText('Test Modal')).toBeTruthy();
    expect(getByText('Modal Content')).toBeTruthy();
  });
});
