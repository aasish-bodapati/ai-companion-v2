import Constants from 'expo-constants';

import { DebugUtils } from '../utils/debugUtils';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';
export const API_BASE_URL = `${API_URL}/api/v1`;

DebugUtils.log('🔍 [API CONFIG] API_URL:', API_URL);
DebugUtils.log('🔍 [API CONFIG] API_BASE_URL:', API_BASE_URL);
