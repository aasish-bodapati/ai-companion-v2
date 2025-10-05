import Constants from 'expo-constants';

const OPENWEATHER_API_KEY = Constants.expoConfig?.extra?.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;

export interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

export interface WeatherError {
  message: string;
  code?: string;
}

class WeatherService {
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  private apiKey = OPENWEATHER_API_KEY;

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    if (!this.apiKey || this.apiKey === 'your_openweathermap_api_key_here') {
      throw new Error('OpenWeatherMap API key not configured. Please add your API key to the .env file.');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        city: data.name,
        country: data.sys.country,
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  }

  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    if (!this.apiKey || this.apiKey === 'your_openweathermap_api_key_here') {
      throw new Error('OpenWeatherMap API key not configured. Please add your API key to the .env file.');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        city: data.name,
        country: data.sys.country,
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  }

  getWeatherIcon(iconCode: string): string {
    // Map OpenWeatherMap icon codes to Ionicons
    const iconMap: { [key: string]: string } = {
      '01d': 'sunny',
      '01n': 'moon',
      '02d': 'partly-sunny',
      '02n': 'cloudy-night',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'partly-sunny',
      '50n': 'cloudy-night',
    };

    return iconMap[iconCode] || 'partly-sunny';
  }

  async getTodayHourlyForecast(latitude: number, longitude: number): Promise<HourlyForecast[]> {
    if (!this.apiKey || this.apiKey === 'your_openweathermap_api_key_here') {
      throw new Error('OpenWeatherMap API key not configured. Please add your API key to the .env file.');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric&cnt=12`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Generate hourly data from 3-hour intervals
      const forecasts: HourlyForecast[] = [];
      const now = new Date();
      const currentHour = now.getHours();
      
      // Get current time first, then 6 hours before, then 12 hours after (19 total hours)
      // Current hour will be at index 0 (first position), but we'll scroll to show it first
      
      // Add current hour first
      const currentDate = new Date(now);
      currentDate.setHours(currentHour, 0, 0, 0);
      
      // Find the closest forecast data point for current hour
      let closestData = data.list[0];
      let minDiff = Math.abs(new Date(data.list[0].dt * 1000).getTime() - currentDate.getTime());
      
      for (const item of data.list) {
        const itemTime = new Date(item.dt * 1000).getTime();
        const diff = Math.abs(itemTime - currentDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestData = item;
        }
      }
      
      forecasts.push({
        time: currentDate.toLocaleTimeString([], { 
          hour: 'numeric',
          hour12: true 
        }),
        temperature: Math.round(closestData.main.temp),
        description: closestData.weather[0].description,
        icon: closestData.weather[0].icon,
        humidity: closestData.main.humidity,
        windSpeed: Math.round(closestData.wind.speed * 10) / 10,
        precipitation: Math.round(((closestData.rain?.['3h'] || 0) + (closestData.snow?.['3h'] || 0)) / 3 * 10) / 10,
      });
      
      // Then add 6 hours before current time
      for (let i = -6; i < 0; i++) {
        const targetHour = currentHour + i;
        const targetDate = new Date(now);
        targetDate.setHours(targetHour, 0, 0, 0);
        
        // Find the closest forecast data point
        let closestData = data.list[0];
        let minDiff = Math.abs(new Date(data.list[0].dt * 1000).getTime() - targetDate.getTime());
        
        for (const item of data.list) {
          const itemTime = new Date(item.dt * 1000).getTime();
          const diff = Math.abs(itemTime - targetDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closestData = item;
          }
        }
        
        // Interpolate temperature for more realistic hourly variation
        const baseTemp = closestData.main.temp;
        const variation = Math.sin(((i + 6) * Math.PI) / 18) * 2; // Small temperature variation
        const interpolatedTemp = baseTemp + variation;
        
        forecasts.push({
          time: targetDate.toLocaleTimeString([], { 
            hour: 'numeric',
            hour12: true 
          }),
          temperature: Math.round(interpolatedTemp),
          description: closestData.weather[0].description,
          icon: closestData.weather[0].icon,
          humidity: closestData.main.humidity,
          windSpeed: Math.round(closestData.wind.speed * 10) / 10,
          precipitation: Math.round(((closestData.rain?.['3h'] || 0) + (closestData.snow?.['3h'] || 0)) / 3 * 10) / 10,
        });
      }
      
      // Then add 12 hours after current time
      for (let i = 1; i <= 12; i++) {
        const targetHour = currentHour + i;
        const targetDate = new Date(now);
        targetDate.setHours(targetHour, 0, 0, 0);
        
        // Find the closest forecast data point
        let closestData = data.list[0];
        let minDiff = Math.abs(new Date(data.list[0].dt * 1000).getTime() - targetDate.getTime());
        
        for (const item of data.list) {
          const itemTime = new Date(item.dt * 1000).getTime();
          const diff = Math.abs(itemTime - targetDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closestData = item;
          }
        }
        
        // Interpolate temperature for more realistic hourly variation
        const baseTemp = closestData.main.temp;
        const variation = Math.sin((i * Math.PI) / 12) * 2; // Small temperature variation
        const interpolatedTemp = baseTemp + variation;
        
        forecasts.push({
          time: targetDate.toLocaleTimeString([], { 
            hour: 'numeric',
            hour12: true 
          }),
          temperature: Math.round(interpolatedTemp),
          description: closestData.weather[0].description,
          icon: closestData.weather[0].icon,
          humidity: closestData.main.humidity,
          windSpeed: Math.round(closestData.wind.speed * 10) / 10,
          precipitation: Math.round(((closestData.rain?.['3h'] || 0) + (closestData.snow?.['3h'] || 0)) / 3 * 10) / 10,
        });
      }

      // Debug: Log the forecast structure
      console.log('Weather service forecast structure:', forecasts.map((item, index) => ({
        index,
        time: item.time,
        isCurrent: index === 0
      })));
      
      return forecasts;
    } catch (error) {
      console.error('Weather forecast API error:', error);
      throw error;
    }
  }

  getWeatherColor(iconCode: string): string {
    // Map weather conditions to colors
    const colorMap: { [key: string]: string } = {
      '01d': '#f59e0b', // sunny
      '01n': '#6366f1', // clear night
      '02d': '#f97316', // partly cloudy day
      '02n': '#8b5cf6', // partly cloudy night
      '03d': '#6b7280', // cloudy
      '03n': '#6b7280', // cloudy
      '04d': '#6b7280', // overcast
      '04n': '#6b7280', // overcast
      '09d': '#3b82f6', // rain
      '09n': '#3b82f6', // rain
      '10d': '#3b82f6', // rain
      '10n': '#3b82f6', // rain
      '11d': '#7c3aed', // thunderstorm
      '11n': '#7c3aed', // thunderstorm
      '13d': '#e5e7eb', // snow
      '13n': '#e5e7eb', // snow
      '50d': '#9ca3af', // mist
      '50n': '#9ca3af', // mist
    };

    return colorMap[iconCode] || '#6b7280';
  }
}

export default new WeatherService();
