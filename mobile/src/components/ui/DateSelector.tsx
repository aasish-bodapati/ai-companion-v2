import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CalendarComponent from '../common/CalendarComponent';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';
import { hapticFeedback } from '../../utils/haptics';

interface DateSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  label?: string;
  showTodayButton?: boolean;
  style?: Record<string, unknown>;
  calendarModalTitle?: string;
  showLogsIndicator?: boolean;
  testID?: string;
}

export default function DateSelector({
  selectedDate,
  onDateSelect,
  label = 'Date',
  showTodayButton = true,
  style,
  calendarModalTitle = 'Select Date',
  showLogsIndicator = false,
}: DateSelectorProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDateForDisplay = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
    }
  };

  const handleDateSelect = (date: Date) => {
    hapticFeedback.light();
    onDateSelect(date);
    setShowCalendar(false);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    hapticFeedback.light();
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    onDateSelect(newDate);
  };

  const goToToday = () => {
    hapticFeedback.light();
    onDateSelect(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const openCalendar = () => {
    hapticFeedback.light();
    setShowCalendar(true);
  };

  const closeCalendar = () => {
    hapticFeedback.light();
    setShowCalendar(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.selectorContainer}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateDate('prev')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={16} color={COLORS.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={openCalendar}
        >
          <Ionicons name="calendar-outline" size={16} color={COLORS.text.secondary} />
          <Text style={styles.dateText}>
            {formatDateForDisplay(selectedDate)}
          </Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateDate('next')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-forward" size={16} color={COLORS.text.secondary} />
        </TouchableOpacity>
        
        {showTodayButton && (
          <TouchableOpacity 
            style={[
              styles.todayButton,
              isToday(selectedDate) && styles.todayButtonActive
            ]}
            onPress={goToToday}
          >
            <Text style={[
              styles.todayButtonText,
              isToday(selectedDate) && styles.todayButtonTextActive
            ]}>
              Today
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCalendar}
      >
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>{calendarModalTitle}</Text>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={closeCalendar}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.calendarModalBody}
              activeOpacity={1}
              onPress={closeCalendar}
            >
              <TouchableOpacity 
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <CalendarComponent
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  showLogsIndicator={showLogsIndicator}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    minWidth: 160,
    maxWidth: 180,
  },
  dateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  todayButton: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    height: 32,
    justifyContent: 'center',
  },
  todayButtonActive: {
    backgroundColor: COLORS.primary.main,
    borderColor: COLORS.primary.main,
  },
  todayButtonText: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  todayButtonTextActive: {
    color: COLORS.text.inverse,
  },

  // Calendar Modal Styles
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  calendarModal: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    maxHeight: '70%',
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  calendarModalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  calendarCloseButton: {
    padding: SPACING.xs,
  },
  calendarModalBody: {
    padding: SPACING.xl,
  },
});
