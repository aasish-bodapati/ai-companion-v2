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
        `${this.baseUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric&cnt=40`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      
      // Process the API data to create hourly forecasts
      const forecasts: HourlyForecast[] = [];
      const now = new Date();
      const currentTime = now.getTime();
      const currentHour = now.getHours();
      
      // Filter and sort the API data to get the most relevant forecasts
      const relevantForecasts = data.list
        .map((item: any) => ({
          ...item,
          timestamp: new Date(item.dt * 1000).getTime()
        }))
        .filter((item: any) => {
          // Include forecasts from 6 hours ago to 18 hours in the future
          const timeDiff = item.timestamp - currentTime;
          return timeDiff >= -6 * 60 * 60 * 1000 && timeDiff <= 18 * 60 * 60 * 1000;
        })
        .sort((a: any, b: any) => a.timestamp - b.timestamp);
      
      // Generate hourly data by interpolating between 3-hour intervals
      const allHourlyData: { time: Date; data: unknown }[] = [];
      
      for (let i = 0; i < relevantForecasts.length - 1; i++) {
        const current = relevantForecasts[i];
        const next = relevantForecasts[i + 1];
        
        // Get the time range for this 3-hour period
        const startTime = new Date(current.timestamp);
        const endTime = new Date(next.timestamp);
        
        // Generate hourly data for this 3-hour period
        for (let hour = 0; hour < 3; hour++) {
          const targetTime = new Date(startTime.getTime() + hour * 60 * 60 * 1000);
          
          // Skip if this hour is more than 6 hours in the past
          if (targetTime.getTime() < currentTime - 6 * 60 * 60 * 1000) {
            continue;
          }
          
          // Skip if this hour is more than 18 hours in the future
          if (targetTime.getTime() > currentTime + 18 * 60 * 60 * 1000) {
            continue;
          }
          
          // Interpolate temperature between current and next forecast
          const progress = hour / 3;
          const interpolatedTemp = current.main.temp + (next.main.temp - current.main.temp) * progress;
          
          // Use current forecast data for other properties (they don't change much in 3 hours)
          const forecastData = {
            time: targetTime.toLocaleTimeString([], { 
              hour: 'numeric',
              hour12: true 
            }),
            temperature: Math.round(interpolatedTemp),
            description: current.weather[0].description,
            icon: current.weather[0].icon,
            humidity: Math.round(current.main.humidity + (next.main.humidity - current.main.humidity) * progress),
            windSpeed: Math.round((current.wind.speed + (next.wind.speed - current.wind.speed) * progress) * 10) / 10,
            precipitation: Math.round(((current.rain?.['3h'] || 0) + (current.snow?.['3h'] || 0)) / 3 * 10) / 10,
          };
          
          allHourlyData.push({ time: targetTime, data: forecastData });
        }
      }
      
      // Add the last forecast if it's within our time range
      if (relevantForecasts.length > 0) {
        const last = relevantForecasts[relevantForecasts.length - 1];
        const lastTime = new Date(last.timestamp);
        
        if (lastTime.getTime() <= currentTime + 18 * 60 * 60 * 1000) {
          allHourlyData.push({
            time: lastTime,
            data: {
              time: lastTime.toLocaleTimeString([], { 
                hour: 'numeric',
                hour12: true 
              }),
              temperature: Math.round(last.main.temp),
              description: last.weather[0].description,
              icon: last.weather[0].icon,
              humidity: last.main.humidity,
              windSpeed: Math.round(last.wind.speed * 10) / 10,
              precipitation: Math.round(((last.rain?.['3h'] || 0) + (last.snow?.['3h'] || 0)) / 3 * 10) / 10,
            }
          });
        }
      }
      
      // Sort by time
      allHourlyData.sort((a, b) => a.time.getTime() - b.time.getTime());
      
      // If we don't have enough past data, generate some using the first available data point
      if (allHourlyData.length > 0) {
        const firstDataPoint = allHourlyData[0];
        const firstTime = firstDataPoint.time;
        const currentTimeDate = new Date(currentTime);
        
        // Generate past hours if we don't have them
        for (let i = 1; i <= 6; i++) {
          const pastHour = new Date(currentTimeDate);
          pastHour.setHours(currentHour - i, 0, 0, 0);
          
          // Only add if this hour is not already in our data
          const exists = allHourlyData.some(item => 
            item.time.getHours() === pastHour.getHours() && 
            item.time.getDate() === pastHour.getDate()
          );
          
          if (!exists) {
            // Use the first data point as a base for past hours
            const pastData = {
              time: pastHour.toLocaleTimeString([], { 
                hour: 'numeric',
                hour12: true 
              }),
              temperature: Math.round(firstDataPoint.data.temperature - (i * 0.5)), // Slight temperature variation
              description: firstDataPoint.data.description,
              icon: firstDataPoint.data.icon,
              humidity: firstDataPoint.data.humidity,
              windSpeed: firstDataPoint.data.windSpeed,
              precipitation: firstDataPoint.data.precipitation,
            };
            
            allHourlyData.unshift({ time: pastHour, data: pastData });
          }
        }
      }
      
      // Create a clean hourly forecast: 6 past + 1 current + 12 future = 19 hours total
      // Structure: [past6, past5, past4, past3, past2, past1, current, future1, future2, ...]
      const finalForecasts: HourlyForecast[] = [];
      
      
      // Find the closest data point to current time for the current hour
      let currentHourData = allHourlyData.find(item => {
        const itemTime = item.time.getTime();
        const timeDiff = Math.abs(itemTime - currentTime);
        return timeDiff <= 60 * 60 * 1000; // Within 1 hour
      });
      
      if (!currentHourData && allHourlyData.length > 0) {
        // If no close match, use the first available data point
        currentHourData = allHourlyData[0];
      }
      
      // Create current hour entry
      const currentHourEntry = currentHourData ? {
        time: new Date(currentTime).toLocaleTimeString([], { 
          hour: 'numeric',
          hour12: true 
        }),
        temperature: Math.round(currentHourData.data.temperature),
        description: currentHourData.data.description,
        icon: currentHourData.data.icon,
        humidity: currentHourData.data.humidity,
        windSpeed: currentHourData.data.windSpeed,
        precipitation: currentHourData.data.precipitation,
      } : {
        time: new Date(currentTime).toLocaleTimeString([], { 
          hour: 'numeric',
          hour12: true 
        }),
        temperature: 22,
        description: 'Clear',
        icon: '01d',
        humidity: 50,
        windSpeed: 5,
        precipitation: 0,
      };
      
      // Add 6 past hours first (indices 0-5) - in reverse chronological order for left scrolling
      for (let i = 6; i >= 1; i--) {
        const pastHour = new Date(currentTime);
        pastHour.setHours(currentHour - i, 0, 0, 0);
        
        // Find the closest data point for this past hour
        const closestData = allHourlyData.find(item => {
          const itemTime = item.time.getTime();
          const timeDiff = Math.abs(itemTime - pastHour.getTime());
          return timeDiff <= 90 * 60 * 1000; // Within 1.5 hours
        });
        
        const pastHourEntry = closestData ? {
          time: pastHour.toLocaleTimeString([], { 
            hour: 'numeric',
            hour12: true 
          }),
          temperature: Math.round(closestData.data.temperature),
          description: closestData.data.description,
          icon: closestData.data.icon,
          humidity: closestData.data.humidity,
          windSpeed: closestData.data.windSpeed,
          precipitation: closestData.data.precipitation,
        } : {
          time: pastHour.toLocaleTimeString([], { 
            hour: 'numeric',
            hour12: true 
          }),
          temperature: Math.round((currentHourEntry.temperature || 22) - (i * 0.5)),
          description: currentHourEntry.description || 'Clear',
          icon: currentHourEntry.icon || '01d',
          humidity: currentHourEntry.humidity || 50,
          windSpeed: currentHourEntry.windSpeed || 5,
          precipitation: currentHourEntry.precipitation || 0,
        };
        
        finalForecasts.push(pastHourEntry);
      }
      
      // Add current hour (index 6)
      finalForecasts.push(currentHourEntry);
      
      // Add 12 future hours (indices 7-18)
      for (let i = 1; i <= 12; i++) {
        const futureHour = new Date(currentTime);
        futureHour.setHours(currentHour + i, 0, 0, 0);
        
        // Find the closest data point for this future hour
        const closestData = allHourlyData.find(item => {
          const itemTime = item.time.getTime();
          const timeDiff = Math.abs(itemTime - futureHour.getTime());
          return timeDiff <= 90 * 60 * 1000; // Within 1.5 hours
        });
        
        const futureHourEntry = closestData ? {
          time: futureHour.toLocaleTimeString([], { 
            hour: 'numeric',
            hour12: true 
          }),
          temperature: Math.round(closestData.data.temperature),
          description: closestData.data.description,
          icon: closestData.data.icon,
          humidity: closestData.data.humidity,
          windSpeed: closestData.data.windSpeed,
          precipitation: closestData.data.precipitation,
        } : {
          time: futureHour.toLocaleTimeString([], { 
            hour: 'numeric',
            hour12: true 
          }),
          temperature: Math.round((currentHourEntry.temperature || 22) + (i * 0.3)),
          description: currentHourEntry.description || 'Clear',
          icon: currentHourEntry.icon || '01d',
          humidity: currentHourEntry.humidity || 50,
          windSpeed: currentHourEntry.windSpeed || 5,
          precipitation: currentHourEntry.precipitation || 0,
        };
        
        finalForecasts.push(futureHourEntry);
      }
      
      forecasts.push(...finalForecasts);
      
      
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
