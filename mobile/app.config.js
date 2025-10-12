export default {
  expo: {
    name: 'AI Companion Mobile',
    slug: 'ai-companion-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    assetBundlePatterns: ['**/*'],
    plugins: [
      'expo-font'
    ],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#ffffff',
      },
    },
    extra: {
      apiUrl: 'http://192.168.1.11:8000',
      OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    },
  },
};
