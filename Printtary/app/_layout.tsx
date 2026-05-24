import { AlertProvider } from '@/template';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PrintProvider } from '@/contexts/PrintContext';
import { Colors } from '@/constants/theme';
import { reportClientError } from '@/services/errorLogger';

function ErrorReporter() {
  useEffect(() => {
    const sendError = (error: unknown, metadata?: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      reportClientError({
        message,
        stack,
        severity: 'error',
        metadata,
      });
    };

    const handleError = (event: ErrorEvent) => {
      sendError(event.error ?? event.message, {
        type: 'window.error',
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      sendError(event.reason, { type: 'unhandledrejection' });
    };

    globalThis.addEventListener?.('error', handleError as EventListener);
    globalThis.addEventListener?.('unhandledrejection', handleRejection as EventListener);

    return () => {
      globalThis.removeEventListener?.('error', handleError as EventListener);
      globalThis.removeEventListener?.('unhandledrejection', handleRejection as EventListener);
    };
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <ErrorReporter />
        <PrintProvider>
          <StatusBar style="dark" backgroundColor={Colors.bg} />
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
  );
}
