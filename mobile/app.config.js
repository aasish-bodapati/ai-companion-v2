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
      apiUrl: process.env.API_URL || 'https://republishable-nondisingenuously-brittaney.ngrok-free.dev',
    },
  },
};
