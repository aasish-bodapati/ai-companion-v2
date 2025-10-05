import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
export const API_BASE_URL = `${API_URL}/api/v1`;

console.log('🔍 [API CONFIG] API_URL:', API_URL);
console.log('🔍 [API CONFIG] API_BASE_URL:', API_BASE_URL);
