import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { AppLoading } from '@/components/ui/AppLoading';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <AppLoading />;

  return <Redirect href={isSignedIn ? '/(tabs)' : '/onboarding'} />;
}
