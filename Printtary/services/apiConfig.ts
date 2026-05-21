const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export function getApiBaseUrl() {
  return envApiBaseUrl ?? 'https://printopay.onrender.com/api/v1';
}
