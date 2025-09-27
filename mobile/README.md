# AI Companion Mobile

A React Native mobile app built with Expo SDK 54 and TypeScript for the AI Companion project.

## ✅ Features

- **Expo SDK 54** - Latest stable version compatible with Expo Go
- **TypeScript** - Full type safety
- **React Navigation** - Stack navigator with TypeScript types
- **API Integration** - Axios setup with environment variables
- **HomeScreen** - Fetches data from `${API_URL}/health` endpoint
- **ESLint + Prettier** - Code quality and formatting tools
- **Environment Variables** - `.env` file for API configuration

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Update `API_URL` in `.env` file to match your FastAPI backend
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

## 📱 Project Structure

```
src/
├── components/     # Reusable UI components
│   └── LoadingSpinner.tsx
├── screens/        # Screen components
│   └── HomeScreen.tsx
├── navigation/     # Navigation configuration
│   └── AppNavigator.tsx
└── services/       # API services and utilities
    ├── api.ts
    └── healthService.ts
```

## 🔧 Configuration

The app is configured to connect to your FastAPI backend at the `/health` endpoint. The HomeScreen will display the response from this endpoint.

## 📦 Dependencies

- **Expo SDK 54** - Cross-platform development
- **React Navigation 7** - Navigation library
- **Axios** - HTTP client for API calls
- **TypeScript** - Type safety
- **ESLint & Prettier** - Code quality tools

## 🎉 Ready to Use!

Your mobile app is now ready with Expo SDK 54 and should work perfectly with the Expo Go app! The project structure follows React Native best practices and is ready for development.