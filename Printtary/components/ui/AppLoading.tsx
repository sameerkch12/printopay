import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export function AppLoading({ message = 'Loading PrintoPay...' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.primaryLight} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bg,
    padding: Spacing.lg,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
});
