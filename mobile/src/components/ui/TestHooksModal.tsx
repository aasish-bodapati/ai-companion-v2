import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModalState, useFormState, useLoadingState } from '../../hooks';
import { COMMON_STYLES } from '../../theme/constants';

/**
 * Test component to demonstrate the new shared hooks
 * This component shows how to use useModalState, useFormState, and useLoadingState
 */
export default function TestHooksModal() {
  // Modal state management
  const modal = useModalState(false);
  
  // Form state management with validation
  const form = useFormState(
    { name: '', email: '', message: '' },
    {
      name: { required: true, minLength: 2 },
      email: { required: true, email: true },
      message: { required: true, minLength: 10 },
    }
  );
  
  // Loading state management
  const loading = useLoadingState();

  const handleSubmit = async () => {
    // Validate form
    if (!form.validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    // Simulate API call with loading state
    await loading.withLoading(async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success
      Alert.alert('Success', 'Form submitted successfully!');
      form.resetForm();
      modal.hide();
    });
  };

  const handleCancel = () => {
    form.resetForm();
    modal.hide();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.openButton} onPress={modal.show}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.openButtonText}>Test Hooks</Text>
      </TouchableOpacity>

      {modal.visible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Test Hooks Modal</Text>
              <TouchableOpacity onPress={modal.hide} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
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
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading.loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  (!form.isFormValid() || loading.loading) && styles.buttonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!form.isFormValid() || loading.loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading.loading ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: COMMON_STYLES.smallRadius,
  },
  openButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.standardRadius,
    width: '90%',
    maxHeight: '80%',
    ...COMMON_STYLES.standardShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 16,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: COMMON_STYLES.smallRadius,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
