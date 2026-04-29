import { StyleSheet } from 'react-native';
import { ThemedView, ThemedCustomText } from '@components/themed';

export default function HuntsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedCustomText variant="h2">Hunts</ThemedCustomText>
      <ThemedCustomText variant="body">Browse available hunts and recent activity.</ThemedCustomText>
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
