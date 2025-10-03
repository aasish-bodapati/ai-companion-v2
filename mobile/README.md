# AI Companion Mobile App

A React Native mobile app built with Expo SDK 54 and TypeScript for comprehensive health and wellness tracking.

## ✨ Features

### 🏃‍♂️ **Health Logging**
- **Fitness Tracking**: Log workouts, sets, reps, and progress
- **Nutrition Logging**: Track meals, macros, and food items
- **Mood & Energy**: Daily wellness tracking and mood assessment
- **Water Intake**: Hydration tracking and reminders

### 🤖 **AI-Powered Insights**
- **Pattern Recognition**: AI analysis of health data correlations
- **Personalized Recommendations**: Tailored advice based on your data
- **Goal Tracking**: Set and monitor health objectives
- **Smart Coaching**: AI assistant for health guidance

### 📱 **Mobile-First Design**
- **Touch-Optimized**: Designed for mobile interaction
- **Offline Support**: Log activities without internet connection
- **Real-time Sync**: Seamless data synchronization with web app
- **Haptic Feedback**: Enhanced user experience with tactile responses

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device
- Backend API running (see main README.md)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Update `API_URL` in `app.config.js` to match your FastAPI backend
   - Default is set to `http://localhost:8000`

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your device:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or use `npm run android` / `npm run ios` for simulators

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run build` - Build the app for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 📱 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── fitness/        # Fitness-related components
│   ├── nutrition/      # Nutrition-related components
│   ├── analytics/      # Analytics and charts
│   ├── profile/        # User profile components
│   └── ui/             # Generic UI components
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── onboarding/     # Onboarding flow
│   └── main/           # Main app screens
├── navigation/         # Navigation configuration
├── services/           # API services and utilities
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔧 Configuration

The app connects to your FastAPI backend for data synchronization. Key configuration:

- **API URL**: Set in `app.config.js`
- **Authentication**: JWT token-based auth
- **Offline Support**: AsyncStorage for local data persistence
- **Push Notifications**: Configured for health reminders

## 📦 Key Dependencies

- **Expo SDK 54** - Cross-platform development framework
- **React Navigation 7** - Navigation library with TypeScript
- **Axios** - HTTP client for API calls
- **TypeScript** - Type safety and development experience
- **React Native Reanimated** - Smooth animations
- **React Native SVG** - Vector graphics support
- **AsyncStorage** - Local data persistence
- **Expo Haptics** - Tactile feedback

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm run test:ui
npm run test:integration
```

## 🎨 Design System

The app follows a consistent design system with:
- **Color Palette**: Health-focused colors with light/dark mode support
- **Typography**: Clear, readable fonts optimized for mobile
- **Spacing**: Consistent spacing scale for better UX
- **Components**: Reusable UI components with consistent styling

## 🔒 Security & Privacy

- **JWT Authentication**: Secure token-based authentication
- **Data Encryption**: Health data encrypted in transit and at rest
- **Privacy Controls**: User control over data sharing and AI analysis
- **GDPR Compliance**: Full compliance with data protection regulations

## 🚀 Deployment

### Development
- Use Expo Go for development and testing
- Hot reloading for fast development cycles
- Easy debugging with Expo DevTools

### Production
- Build for app stores using EAS Build
- OTA updates for quick bug fixes
- Performance optimization for production

## 📚 Documentation

- [API Integration Guide](docs/API_EXAMPLES.md)
- [Health Logging Guide](docs/HEALTH_LOGGING.md)
- [AI Features Guide](docs/AI_FEATURES.md)
- [Database Schemas](docs/DATABASE_SCHEMAS.md)

## 🎉 Ready to Use!

Your mobile app is ready with Expo SDK 54 and provides a comprehensive health tracking experience. The app follows React Native best practices and is optimized for both development and production use.