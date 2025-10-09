import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../../utils/toast';

interface ComprehensiveRoutineModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRoutineCreated: () => void;
}

export default function ComprehensiveRoutineModal({
  isVisible,
  onClose,
  onRoutineCreated,
}: ComprehensiveRoutineModalProps) {
  const [routineName, setRoutineName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setRoutineName('');
    onClose();
  };

  const handleCreate = async () => {
    if (!routineName.trim()) {
      showToast.error('Error', 'Please enter a routine name');
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement routine creation logic
      showToast.success('Success!', `Routine "${routineName}" created`);
      handleClose();
      onRoutineCreated();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to create routine';
      showToast.error('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Custom Routine</Text>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading || !routineName.trim()}
            style={[
              styles.createButton,
              (!routineName.trim() || loading) && styles.createButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.placeholderText}>
            Comprehensive routine creation coming soon...
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 50,
  },
});