import { AlertProvider } from '@/template';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PrintProvider } from '@/contexts/PrintContext';
import { Colors } from '@/constants/theme';

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  if (!clerkPublishableKey || clerkPublishableKey === 'replace_with_your_clerk_publishable_key') {
    throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to Printtary/.env');
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <AlertProvider>
        <SafeAreaProvider>
          <PrintProvider>
            <StatusBar style="light" backgroundColor={Colors.bg} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.bg },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="scan" options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
              <Stack.Screen name="upload" options={{ headerShown: false }} />
              <Stack.Screen name="shop/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="print-settings" options={{ headerShown: false }} />
              <Stack.Screen name="otp-success" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="job-details" options={{ headerShown: false }} />
            </Stack>
          </PrintProvider>
        </SafeAreaProvider>
      </AlertProvider>
    </ClerkProvider>
  );
}
