import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { showToast } from '../../utils/toast';
import { COMMON_STYLES } from '../../theme/constants';

interface TimezoneSelectorProps {
  currentTimezone: string;
  onTimezoneChange: (timezone: string) => void;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India Standard Time)', offset: '+05:30' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time)', offset: '-05:00' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)', offset: '-08:00' },
  { value: 'Europe/London', label: 'Europe/London (Greenwich Mean Time)', offset: '+00:00' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan Standard Time)', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (Australian Eastern Time)', offset: '+10:00' },
  { value: 'Europe/Paris', label: 'Europe/Paris (Central European Time)', offset: '+01:00' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)', offset: '-06:00' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (China Standard Time)', offset: '+08:00' },
];

export default function TimezoneSelector({ currentTimezone, onTimezoneChange }: TimezoneSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTimezoneSelect = async (timezone: string) => {
    if (timezone === currentTimezone) {
      setModalVisible(false);
      return;
    }

    try {
      setLoading(true);
      
      // Update timezone on server
      const response = await apiClient.put('/me', {
        timezone: timezone
      });

      if (response.status === 200) {
        onTimezoneChange(timezone);
        showToast.success('Success', 'Timezone updated successfully');
        setModalVisible(false);
      } else {
        throw new Error('Failed to update timezone');
      }
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      showToast.error('Error', 'Failed to update timezone. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTimezoneLabel = () => {
    const timezone = TIMEZONES.find(tz => tz.value === currentTimezone);
    return timezone ? `${timezone.label} (${timezone.offset})` : currentTimezone;
  };

  const renderTimezoneItem = ({ item }: { item: typeof TIMEZONES[0] }) => (
    <TouchableOpacity
      style={[
        styles.timezoneItem,
        item.value === currentTimezone && styles.selectedTimezoneItem
      ]}
      onPress={() => handleTimezoneSelect(item.value)}
      disabled={loading}
    >
      <View style={styles.timezoneItemContent}>
        <View style={styles.timezoneInfo}>
          <Text style={[
            styles.timezoneLabel,
            item.value === currentTimezone && styles.selectedTimezoneLabel
          ]}>
            {item.label}
          </Text>
          <Text style={[
            styles.timezoneOffset,
            item.value === currentTimezone && styles.selectedTimezoneOffset
          ]}>
            {item.offset}
          </Text>
        </View>
        {item.value === currentTimezone && (
          <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.timezoneButton}
        onPress={() => setModalVisible(true)}
        disabled={loading}
      >
        <View style={styles.timezoneButtonContent}>
          <View style={styles.timezoneButtonInfo}>
            <Ionicons name="globe-outline" size={20} color="#6366f1" />
            <Text style={styles.timezoneButtonLabel}>Timezone</Text>
          </View>
          <View style={styles.timezoneButtonValue}>
            <Text style={styles.timezoneButtonText} numberOfLines={1}>
              {getCurrentTimezoneLabel()}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Timezone</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <FlatList
            data={TIMEZONES}
            keyExtractor={(item) => item.value}
            renderItem={renderTimezoneItem}
            style={styles.timezoneList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  timezoneButton: {
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    marginVertical: 4,
  },
  timezoneButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timezoneButtonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timezoneButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  timezoneButtonValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  timezoneButtonText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalPlaceholder: {
    width: 32,
  },
  timezoneList: {
    flex: 1,
  },
  timezoneItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedTimezoneItem: {
    backgroundColor: '#f0f9ff',
  },
  timezoneItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timezoneInfo: {
    flex: 1,
  },
  timezoneLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  selectedTimezoneLabel: {
    color: '#1e40af',
    fontWeight: '500',
  },
  timezoneOffset: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedTimezoneOffset: {
    color: '#3b82f6',
  },
});
