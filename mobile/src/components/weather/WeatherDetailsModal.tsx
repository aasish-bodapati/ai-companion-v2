import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING, FONT_SIZE } from '../../theme/constants';
import weatherService, { HourlyForecast, WeatherData } from '../../services/weatherService';

interface WeatherDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  currentWeather: WeatherData | null;
}

const { width } = Dimensions.get('window');

export default function WeatherDetailsModal({
  visible,
  onClose,
  currentWeather,
}: WeatherDetailsModalProps) {
  const [forecast, setForecast] = useState<HourlyForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrollViewRef, setScrollViewRef] = useState<ScrollView | null>(null);

  useEffect(() => {
    if (visible && currentWeather) {
      fetchForecast();
    }
  }, [visible, currentWeather]);

  useEffect(() => {
    if (forecast.length > 0 && scrollViewRef) {
      // Structure: [past6, past5, past4, past3, past2, past1, current, future1, future2, ...]
      // We want to show current hour in the center with past hours on the left
      // Current hour is at index 6, scroll to center it
      const cardWidth = 80; // Approximate width of each hour card
      const screenWidth = 300; // Approximate screen width
      const currentHourIndex = 6; // Current hour is at index 6
      const centerOffset = (screenWidth - cardWidth) / 2;
      const scrollPosition = (currentHourIndex * cardWidth) - centerOffset;
      
      scrollViewRef?.scrollTo({ x: Math.max(0, scrollPosition), animated: false });
    }
  }, [forecast, scrollViewRef]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const forecastData = await weatherService.getTodayHourlyForecast(latitude, longitude);
      setForecast(forecastData);
    } catch (err) {
      console.error('Forecast fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch forecast');
    } finally {
      setLoading(false);
    }
  };

  const renderHourlyForecast = (hour: HourlyForecast, index: number) => {
    const weatherIcon = weatherService.getWeatherIcon(hour.icon);
    const weatherColor = weatherService.getWeatherColor(hour.icon);
    const isCurrentHour = index === 6; // Current hour is at index 6, past hours are at indices 0-5, future hours are at indices 7-18

    return (
      <View key={`${hour.time}-${index}`} style={[
        styles.hourlyItem,
        isCurrentHour && styles.currentHourItem
      ]}>
        <Text style={[
          styles.hourTime,
          isCurrentHour && styles.currentHourTime
        ]}>{hour.time}</Text>
        <View style={[
          styles.hourIcon,
          isCurrentHour && styles.currentHourIcon
        ]}>
          <Ionicons name={weatherIcon as any} size={20} color={weatherColor} />
        </View>
        <Text style={[
          styles.hourTemp, 
          { color: weatherColor },
          isCurrentHour && styles.currentHourTemp
        ]}>
          {hour.temperature}°
        </Text>
        <Text style={[
          styles.hourDescription,
          isCurrentHour && styles.currentHourDescription
        ]} numberOfLines={1}>
          {hour.description}
        </Text>
      </View>
    );
  };


  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Today's Weather</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

           <View style={styles.content}>
             {loading && (
               <View style={styles.loadingContainer}>
                 <ActivityIndicator size="small" color={COLORS.primary.main} />
                 <Text style={styles.loadingText}>Loading...</Text>
               </View>
             )}
             
             {error && (
               <View style={styles.errorContainer}>
                 <Ionicons name="cloud-offline" size={24} color={COLORS.text.tertiary} />
                 <Text style={styles.errorText}>Weather unavailable</Text>
               </View>
             )}
             
             {forecast.length > 0 && !loading && (
               <View style={styles.forecastContainer}>
                 <ScrollView 
                   ref={setScrollViewRef}
                   horizontal 
                   showsHorizontalScrollIndicator={false}
                   contentContainerStyle={styles.hourlyContainer}
                 >
                   {forecast.map(renderHourlyForecast)}
                 </ScrollView>
               </View>
             )}
           </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: COLORS.gray[100],
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  forecastContainer: {
    marginBottom: 0,
  },
  forecastTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  hourlyContainer: {
    paddingRight: 0,
  },
  hourlyItem: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 6,
    padding: 8,
    marginRight: 6,
    alignItems: 'center',
    minWidth: 50,
  },
  hourTime: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  hourIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hourTemp: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  hourDescription: {
    fontSize: 9,
    color: COLORS.text.secondary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Current hour highlighting styles
  currentHourItem: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.primary.main,
  },
  currentHourTime: {
    backgroundColor: COLORS.primary.main,
    color: '#ffffff',
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9,
  },
  currentHourIcon: {
    // Keep original styling
  },
  currentHourTemp: {
    // Keep original styling
  },
  currentHourDescription: {
    // Keep original styling
  },
});
