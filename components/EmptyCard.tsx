import { StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function EmptyCard() {
  return (
    <ThemedView style={styles.card}>
      <ThemedText style={styles.text}>Coming Soon</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 100,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    opacity: 0.5, // Make it look like a placeholder
  },
  text: {
    opacity: 0.5,
    fontStyle: 'italic',
  },
});
