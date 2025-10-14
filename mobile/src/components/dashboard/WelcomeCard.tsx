import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_WEIGHT } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';
import { useWeather } from '../../hooks/useWeather';
import { notificationsService } from '../../services';
import WeatherDetailsModal from '../weather/WeatherDetailsModal';

interface WelcomeCardProps {
  userName?: string;
  onPress?: () => void;
}

export default function WelcomeCard({ userName = 'there', onPress }: WelcomeCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const { weather, loading: weatherLoading, error: weatherError } = useWeather();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();

    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Good Morning',
        icon: 'sunny',
        color: COLORS.warning,
        message: 'Ready to start your day strong?',
        backgroundColor: COLORS.warningLight + '20', // 20% opacity
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: 'Good Afternoon',
        icon: 'partly-sunny',
        color: '#f97316', // Orange color not in theme yet
        message: 'How\'s your day going?',
        backgroundColor: '#fed7aa', // Light orange not in theme yet
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: 'Good Evening',
        icon: 'moon',
        color: '#8b5cf6', // Purple color not in theme yet
        message: 'Time to wind down and reflect',
        backgroundColor: '#ede9fe', // Light purple not in theme yet
      };
    } else {
      return {
        greeting: 'Good Night',
        icon: 'moon',
        color: COLORS.primary.main,
        message: 'Rest well and recharge',
        backgroundColor: COLORS.primary.light + '20', // 20% opacity
      };
    }
  };

  const getMotivationalMessage = () => {
    const messages = [
      'Every small step counts!',
      'You\'re doing amazing!',
      'Keep up the great work!',
      'Progress, not perfection!',
      'You\'ve got this!',
      'Small wins lead to big victories!',
      'Consistency is key!',
      'Your health journey matters!',
    ];

    // Use the day of the year to get a consistent message for the day
    const dayOfYear = Math.floor((currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return messages[dayOfYear % messages.length];
  };

  const greeting = getTimeBasedGreeting();
  const motivationalMessage = getMotivationalMessage();

  // Get weather icon and color
  const weatherIcon = weather ? notificationsService.getWeatherIcon(weather.icon) : 'partly-sunny';
  const weatherColor = weather ? notificationsService.getWeatherColor(weather.icon) : greeting.color;

  const handleCardPress = () => {
    if (weather && !weatherLoading) {
      setShowWeatherModal(true);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: greeting.backgroundColor }]}
        onPress={handleCardPress}
        activeOpacity={0.8}
      >
      <View style={styles.content}>
        <View style={styles.textContent}>
          <View style={styles.greetingRow}>
            <Ionicons
              name={greeting.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={greeting.color}
              style={styles.icon}
            />
            <Text style={[styles.greeting, { color: greeting.color }]}>
              {greeting.greeting}
            </Text>
          </View>

          <Text style={styles.userName}>
            {userName}!
          </Text>

          <Text style={styles.message}>
            {greeting.message}
          </Text>

          <Text style={styles.motivationalMessage}>
            {motivationalMessage}
          </Text>
        </View>

        <View style={styles.rightContent}>
          {/* Weather Section */}
          {weather && !weatherLoading && (
            <View style={styles.weatherContainer}>
              <View style={styles.weatherRow}>
                <Ionicons
                  name={weatherIcon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={weatherColor}
                />
                <Text style={[styles.temperature, { color: weatherColor }]}>
                  {weather.temperature}°
                </Text>
              </View>
              <Text style={styles.weatherDescription}>
                {weather.description}
              </Text>
              <Text style={styles.weatherLocation}>
                {weather.city}
              </Text>
            </View>
          )}

          {weatherLoading && (
            <View style={styles.weatherContainer}>
              <ActivityIndicator size="small" color={greeting.color} />
              <Text style={styles.weatherDescription}>Loading weather...</Text>
            </View>
          )}

          {weatherError && (
            <View style={styles.weatherContainer}>
              <Ionicons
                name="cloud-offline"
                size={20}
                color={COLORS.text.tertiary}
              />
              <Text style={styles.weatherDescription}>Weather unavailable</Text>
            </View>
          )}

          {/* Time Section */}
          <View style={styles.timeContainer}>
            <Text style={[styles.time, { color: greeting.color }]}>
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
            <Text style={styles.date}>
              {currentTime.toLocaleDateString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.arrowContainer}>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={greeting.color}
        />
      </View>
    </TouchableOpacity>

    <WeatherDetailsModal
      visible={showWeatherModal}
      onClose={() => setShowWeatherModal(false)}
      currentWeather={weather}
    />
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    ...STYLE_PRESETS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  greeting: {
    ...STYLE_PRESETS.textSubheading,
    fontWeight: FONT_WEIGHT.semibold,
  },
  userName: {
    ...STYLE_PRESETS.textHeading,
    marginBottom: SPACING.xs,
  },
  message: {
    ...STYLE_PRESETS.textSecondary,
    marginBottom: 6,
  },
  motivationalMessage: {
    ...STYLE_PRESETS.textCaption,
    fontStyle: 'italic',
  },
  weatherContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.sm,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  temperature: {
    ...STYLE_PRESETS.textSubheading,
    fontWeight: FONT_WEIGHT.bold,
    marginLeft: SPACING.xs,
  },
  weatherDescription: {
    ...STYLE_PRESETS.textCaption,
    textAlign: 'right',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  weatherLocation: {
    ...STYLE_PRESETS.textCaption,
    textAlign: 'right',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  time: {
    ...STYLE_PRESETS.textSubheading,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: 2,
  },
  date: {
    ...STYLE_PRESETS.textCaption,
    textAlign: 'right',
  },
  arrowContainer: {
    marginLeft: SPACING.md,
    opacity: 0.7,
  },
});
