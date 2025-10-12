import { useState, useEffect } from 'react';

import * as Location from 'expo-location';
import weatherService, { WeatherData, WeatherError } from '../services/WeatherService';

import { DebugUtils } from '../utils/debugUtils';

interface UseWeatherReturn {
  weather: WeatherData | null;
  loading: boolean;
  error: WeatherError | null;
  refetch: () => Promise<void>;
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<WeatherError | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Fetch weather data
      const weatherData = await weatherService.getCurrentWeather(latitude, longitude);
      setWeather(weatherData);
    } catch (err) {
      DebugUtils.error('Weather fetch error:', err);
      setError({
        message: err instanceof Error ? err.message : 'Failed to fetch weather data',
        code: 'WEATHER_FETCH_ERROR',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return {
    weather,
    loading,
    error,
    refetch: fetchWeather,
  };
}
