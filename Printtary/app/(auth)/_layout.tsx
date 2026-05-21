import { useAuth } from '@clerk/expo';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { AppLoading } from '@/components/ui/AppLoading';

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const params = useLocalSearchParams<{ redirectTo?: string }>();

  if (!isLoaded) return <AppLoading message="Preparing sign in..." />;
  if (isSignedIn) return <Redirect href={(params.redirectTo || '/(tabs)') as never} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
