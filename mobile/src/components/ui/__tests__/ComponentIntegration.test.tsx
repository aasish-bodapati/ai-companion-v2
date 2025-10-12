import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BaseModal from '../BaseModal.simple';
import SmartInput from '../SmartInput';
import { inputPresets, modalConfigs } from '../../../test-utils/testConfigs';

describe('Component Integration', () => {
  it('BaseModal and SmartInput work together', () => {
    const onClose = jest.fn();
    const onChangeText = jest.fn();
    
    const { getByText, getByPlaceholderText } = render(
      <BaseModal
        visible={true}
        onClose={onClose}
        title="Test Modal"
        {...modalConfigs.workoutLogging}
      >
        <SmartInput
          value=""
          onChangeText={onChangeText}
          placeholder="Enter exercise name"
          {...inputPresets.search}
        />
      </BaseModal>
    );
    
    expect(getByText('Test Modal')).toBeTruthy();
    expect(getByPlaceholderText('Enter exercise name')).toBeTruthy();
  });

  it('SmartInput with presets works correctly', () => {
    const onChangeText = jest.fn();
    
    const { getByPlaceholderText } = render(
      <SmartInput
        value=""
        onChangeText={onChangeText}
        {...inputPresets.sets}
      />
    );
    
    const input = getByPlaceholderText('0');
    expect(input).toBeTruthy();
  });

  it('Modal configs are properly defined', () => {
    expect(modalConfigs.workoutLogging).toBeDefined();
    expect(modalConfigs.routineCreation).toBeDefined();
    expect(modalConfigs.confirmation).toBeDefined();
  });
});
