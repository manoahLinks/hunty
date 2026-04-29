import { StyleSheet } from 'react-native';
import { ThemedView, ThemedCustomText } from '@components/themed';

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedCustomText variant="h2">Profile</ThemedCustomText>
      <ThemedCustomText variant="body">Manage your account, wallet, and hunt progress.</ThemedCustomText>
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
