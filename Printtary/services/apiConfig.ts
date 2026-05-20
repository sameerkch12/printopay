import { Platform } from 'react-native';

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export function getApiBaseUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:5000/api/v1`;
    }
  }

  return envApiBaseUrl ?? 'http://localhost:5000/api/v1';
}
