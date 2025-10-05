# Weather Integration Setup

This app now includes weather information in the welcome card! Follow these steps to set up the OpenWeatherMap API:

## 1. Get Your API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to the API keys section
4. Copy your API key

## 2. Configure the API Key

### Option A: Use the Setup Script (Recommended)
Run the setup script to automatically configure your API key:

```bash
npm run setup-weather
```

### Option B: Manual Configuration
1. Open `mobile/.env` file
2. Replace `your_openweathermap_api_key_here` with your actual API key:

```
OPENWEATHER_API_KEY=your_actual_api_key_here
```

## 3. Features

The weather integration includes:

- **Current temperature** with weather icon
- **Weather description** (e.g., "clear sky", "light rain")
- **Location** (city name)
- **Color-coded icons** based on weather conditions
- **Automatic location detection** using device GPS

## 4. Weather Icons

The app maps OpenWeatherMap icons to Ionicons:
- ☀️ Sunny
- 🌤️ Partly cloudy
- ☁️ Cloudy
- 🌧️ Rainy
- ⛈️ Thunderstorm
- ❄️ Snow
- 🌫️ Mist

## 5. Permissions

The app will request location permission to get weather for your current location. This is required for the weather feature to work.

## 6. Fallback

If the weather API is unavailable or location permission is denied, the welcome card will show a fallback message instead of weather information.

## Troubleshooting

- **"Weather unavailable"**: Check your API key and internet connection
- **"Location permission not granted"**: Enable location permissions in your device settings
- **Loading weather...**: The app is fetching weather data, this should complete within a few seconds
