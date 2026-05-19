import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth, useOAuth } from '@clerk/expo';
import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '@/components/ui/GradientButton';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

type Mode = 'sign-in' | 'sign-up';

WebBrowser.maybeCompleteAuthSession();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minPasswordLength = 8;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirectTo?: string }>();
  const { isSignedIn } = useAuth();
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const target = params.redirectTo || '/(tabs)';

  const finish = () => {
    router.replace(target as never);
  };

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error) return err.message;
    const clerkError = err as { errors?: { message?: string }[] };
    return clerkError.errors?.[0]?.message ?? fallback;
  };

  const signInUser = async () => {
    if (!signInLoaded) return;
    if (!emailPattern.test(emailAddress.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: emailAddress.trim(), password });
      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        finish();
      } else {
        setError('Sign in needs another verification step.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not sign in'));
    } finally {
      setBusy(false);
    }
  };

  const signUpUser = async () => {
    if (!signUpLoaded) return;
    if (!emailPattern.test(emailAddress.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters.`);
      return;
    }

    setBusy(true);
    setError('');
    try {
      await signUp.create({ emailAddress: emailAddress.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not sign up'));
    } finally {
      setBusy(false);
    }
  };

  const verifySignUp = async () => {
    if (!signUpLoaded) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6 digit verification code.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });
        finish();
      } else {
        setError('Verification is not complete yet.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not verify code'));
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    setError('');
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(auth)/sign-in'),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        finish();
      } else {
        setError('Google sign-in was not completed.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not sign in with Google'));
    } finally {
      setBusy(false);
    }
  };

  if (isSignedIn) {
    finish();
    return null;
  }

  const isSignUp = mode === 'sign-up';
  const passwordValid = isSignUp ? password.length >= minPasswordLength : Boolean(password);
  const buttonDisabled = busy || (!pendingVerification && (!emailAddress || !passwordValid)) || (pendingVerification && !code);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <View style={styles.card}>
        <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.icon}>
          <Ionicons name={isSignUp ? 'person-add' : 'lock-closed'} size={24} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>{pendingVerification ? 'Verify Email' : isSignUp ? 'Create Account' : 'Sign In'}</Text>
        <Text style={styles.subtitle}>
          {pendingVerification
            ? 'Enter the verification code sent to your email.'
            : 'Sign in before generating OTP so your print jobs stay linked to you.'}
        </Text>

        {!pendingVerification ? (
          <>
            <Pressable
              onPress={signInWithGoogle}
              disabled={busy}
              style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.85 }, busy && { opacity: 0.6 }]}
            >
              <Ionicons name="logo-google" size={18} color="#fff" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            <TextInput
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder="Email address"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              style={styles.input}
            />
            {isSignUp && password && password.length < minPasswordLength ? (
              <Text style={styles.helpText}>Password must be at least {minPasswordLength} characters.</Text>
            ) : null}
          </>
        ) : (
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Verification code"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            maxLength={6}
            style={styles.input}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <GradientButton
          title={busy ? 'Please wait...' : pendingVerification ? 'Verify' : isSignUp ? 'Sign Up' : 'Sign In'}
          onPress={pendingVerification ? verifySignUp : isSignUp ? signUpUser : signInUser}
          disabled={buttonDisabled}
          icon={busy ? <ActivityIndicator color="#fff" /> : undefined}
        />

        {!pendingVerification ? (
          <Pressable
            onPress={() => router.replace({ pathname: isSignUp ? '/(auth)/sign-in' : '/(auth)/sign-up', params } as never)}
            style={styles.switch}
          >
            <Text style={styles.switchText}>{isSignUp ? 'Already have an account? Sign in' : 'New here? Create account'}</Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.bg,
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    includeFontPadding: false,
  },
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.base,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  helpText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  googleButton: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  switch: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
