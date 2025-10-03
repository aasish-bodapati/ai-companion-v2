import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModalState, useFormState, useLoadingState } from '../../hooks';
import ModalContainer from './ModalContainer';
import FormContainer from './FormContainer';
import CardContainer from './CardContainer';
import { COMMON_STYLES } from '../../theme/constants';

/**
 * Test component to demonstrate the new container components
 * Shows ModalContainer, FormContainer, and CardContainer working together
 */
export default function TestContainerComponents() {
  const modal = useModalState(false);
  const form = useFormState(
    { name: '', email: '', message: '' },
    {
      name: { required: true, minLength: 2 },
      email: { required: true, email: true },
      message: { required: true, minLength: 10 },
    }
  );
  const loading = useLoadingState();

  const handleSubmit = async () => {
    if (!form.validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    await loading.withLoading(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', 'Form submitted successfully!');
      form.resetForm();
      modal.hide();
    });
  };

  const handleCancel = () => {
    form.resetForm();
    modal.hide();
  };

  const handleCardAction = (action: string) => {
    Alert.alert('Card Action', `You clicked: ${action}`);
  };

  return (
    <View style={styles.container}>
      {/* Demo Cards */}
      <CardContainer
        title="Welcome Card"
        subtitle="This demonstrates the CardContainer component"
        variant="elevated"
        size="medium"
        actions={[
          {
            label: 'Edit',
            icon: 'create-outline',
            variant: 'primary',
            onPress: () => handleCardAction('Edit'),
          },
          {
            label: 'More',
            icon: 'ellipsis-horizontal',
            variant: 'text',
            onPress: () => handleCardAction('More'),
          },
        ]}
        style={styles.card}
      >
        <Text style={styles.cardText}>
          This is a sample card content. The CardContainer provides consistent styling
          and interaction patterns for card-based layouts.
        </Text>
      </CardContainer>

      <CardContainer
        title="Settings Card"
        subtitle="Another example with different variant"
        variant="outlined"
        size="small"
        onPress={() => handleCardAction('Card Pressed')}
        style={styles.card}
      >
        <Text style={styles.cardText}>
          This card is clickable and uses the outlined variant.
        </Text>
      </CardContainer>

      {/* Open Modal Button */}
      <TouchableOpacity style={styles.openButton} onPress={modal.show}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.openButtonText}>Open Modal</Text>
      </TouchableOpacity>

      {/* Modal with Form */}
      <ModalContainer
        visible={modal.visible}
        onClose={modal.hide}
        title="Contact Form"
        subtitle="Fill out the form below to get in touch"
        variant="centered"
        size="medium"
        testID="contact-modal"
      >
        <FormContainer
          variant="modal"
          actions={[
            {
              label: 'Cancel',
              variant: 'secondary',
              onPress: handleCancel,
              disabled: loading.loading,
            },
            {
              label: 'Submit',
              variant: 'primary',
              onPress: handleSubmit,
              disabled: !form.isFormValid() || loading.loading,
              loading: loading.loading,
            },
          ]}
          testID="contact-form"
        >
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={[
              styles.input,
              form.errors.name && styles.inputError
            ]}
            value={form.data.name}
            onChangeText={(text) => form.updateField('name', text)}
            placeholder="Enter your name"
          />
          {form.errors.name && (
            <Text style={styles.errorText}>{form.errors.name}</Text>
          )}

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[
              styles.input,
              form.errors.email && styles.inputError
            ]}
            value={form.data.email}
            onChangeText={(text) => form.updateField('email', text)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {form.errors.email && (
            <Text style={styles.errorText}>{form.errors.email}</Text>
          )}

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              form.errors.message && styles.inputError
            ]}
            value={form.data.message}
            onChangeText={(text) => form.updateField('message', text)}
            placeholder="Enter your message"
            multiline
            numberOfLines={4}
          />
          {form.errors.message && (
            <Text style={styles.errorText}>{form.errors.message}</Text>
          )}

          {loading.error && (
            <Text style={styles.errorText}>{loading.error}</Text>
          )}
        </FormContainer>
      </ModalContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  card: {
    marginBottom: 16,
  },
  cardText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: COMMON_STYLES.smallRadius,
    alignSelf: 'center',
    marginTop: 16,
  },
  openButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: COMMON_STYLES.smallRadius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
