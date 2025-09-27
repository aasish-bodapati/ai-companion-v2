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
      apiUrl: process.env.API_URL || 'http://192.168.1.5:8000',
    },
  },
};
