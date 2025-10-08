import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../../theme/constants';
import { useWeather } from '../../hooks/useWeather';
import weatherService from '../../services/weatherService';
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
        color: '#f59e0b',
        message: 'Ready to start your day strong?',
        backgroundColor: '#fef3c7',
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: 'Good Afternoon',
        icon: 'partly-sunny',
        color: '#f97316',
        message: 'How\'s your day going?',
        backgroundColor: '#fed7aa',
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: 'Good Evening',
        icon: 'moon',
        color: '#8b5cf6',
        message: 'Time to wind down and reflect',
        backgroundColor: '#ede9fe',
      };
    } else {
      return {
        greeting: 'Good Night',
        icon: 'moon',
        color: '#6366f1',
        message: 'Rest well and recharge',
        backgroundColor: '#e0e7ff',
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
  const weatherIcon = weather ? weatherService.getWeatherIcon(weather.icon) : 'partly-sunny';
  const weatherColor = weather ? weatherService.getWeatherColor(weather.icon) : greeting.color;

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
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    marginRight: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  greeting: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  userName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginBottom: 6,
  },
  motivationalMessage: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
  },
  weatherContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  temperature: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginLeft: 4,
  },
  weatherDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.secondary,
    textAlign: 'right',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  weatherLocation: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.tertiary,
    textAlign: 'right',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  date: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.secondary,
    textAlign: 'right',
  },
  arrowContainer: {
    marginLeft: 12,
    opacity: 0.7,
  },
});
