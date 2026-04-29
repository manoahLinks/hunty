import { StyleSheet } from 'react-native';
import { ThemedView, ThemedCustomText } from '@components/themed';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedCustomText variant="h2">Settings</ThemedCustomText>
      <ThemedCustomText variant="body">Configure theme, accessibility, and app preferences.</ThemedCustomText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
});
