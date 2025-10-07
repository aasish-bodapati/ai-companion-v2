import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarComponentProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  logsWithDates?: Set<string>; // Set of dates that have logs (YYYY-MM-DD format)
  showLogsIndicator?: boolean; // Whether to show indicators for days with logs
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({ 
  selectedDate, 
  onDateSelect, 
  logsWithDates = new Set(),
  showLogsIndicator = false 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  // Close dropdowns when clicking outside
  // const closeDropdowns = () => {
  //   setShowMonthPicker(false);
  //   setShowYearPicker(false);
  // };
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };
  
  const handleMonthChange = (monthIndex: number) => {
    const newMonth = new Date(currentMonth.getFullYear(), monthIndex, 1);
    setCurrentMonth(newMonth);
    setShowMonthPicker(false);
  };
  
  const handleYearChange = (year: number) => {
    const newMonth = new Date(year, currentMonth.getMonth(), 1);
    setCurrentMonth(newMonth);
    setShowYearPicker(false);
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };
  
  const hasLogs = (date: Date) => {
    if (!showLogsIndicator) return false;
    // Use local date instead of UTC to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return logsWithDates.has(dateStr);
  };
  
  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  
  return (
    <View style={styles.calendarContainer}>
      {/* Month/Year Header with Dropdowns */}
      <View style={styles.calendarHeader}>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowMonthPicker(!showMonthPicker)}
          >
            <Text style={styles.dropdownButtonText}>
              {monthNames[currentMonth.getMonth()]}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
          
          {showMonthPicker && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                {monthNames.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.dropdownItem,
                      index === currentMonth.getMonth() && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleMonthChange(index)}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      index === currentMonth.getMonth() && styles.dropdownItemTextSelected
                    ]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowYearPicker(!showYearPicker)}
          >
            <Text style={styles.dropdownButtonText}>
              {currentMonth.getFullYear()}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
          
          {showYearPicker && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                {yearOptions.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.dropdownItem,
                      year === currentMonth.getFullYear() && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleYearChange(year)}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      year === currentMonth.getFullYear() && styles.dropdownItemTextSelected
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
      
      {/* Day Names Header */}
      <View style={styles.calendarDayNames}>
        {dayNames.map((day) => (
          <Text key={day} style={styles.calendarDayName}>{day}</Text>
        ))}
      </View>
      
      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.calendarDay,
              date && isToday(date) && styles.calendarDayToday,
              date && isSelected(date) && styles.calendarDaySelected,
            ]}
            onPress={() => date && onDateSelect(date)}
            disabled={!date}
          >
            {date && (
              <Text style={[
                styles.calendarDayText,
                isToday(date) && styles.calendarDayTextToday,
                isSelected(date) && styles.calendarDayTextSelected,
                hasLogs(date) && styles.calendarDayTextWithLogs,
                hasLogs(date) && isSelected(date) && styles.calendarDayTextWithLogsSelected,
                hasLogs(date) && isToday(date) && !isSelected(date) && styles.calendarDayTextWithLogsToday,
              ]}>
                {date.getDate()}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: {
    backgroundColor: '#dbeafe',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  calendarDayNames: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calendarDayToday: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#374151',
  },
  calendarDayTextToday: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  calendarDayTextWithLogs: {
    color: '#10b981', // Green color for days with logs
    fontWeight: '700',
    backgroundColor: '#d1fae5', // Light green background
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  calendarDayTextWithLogsSelected: {
    color: '#ffffff',
    backgroundColor: '#059669', // Darker green for selected days with logs
    fontWeight: '700',
  },
  calendarDayTextWithLogsToday: {
    color: '#ffffff',
    backgroundColor: '#10b981', // Green background for today with logs
    fontWeight: '700',
  },
});

export default CalendarComponent;
