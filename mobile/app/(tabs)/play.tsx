import { StyleSheet } from 'react-native';
import { ThemedView, ThemedCustomText } from '@components/themed';

export default function PlayScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedCustomText variant="h2">Map/Play</ThemedCustomText>
      <ThemedCustomText variant="body">Open the map, solve clues, and play active hunts.</ThemedCustomText>
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
