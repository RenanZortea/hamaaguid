import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StyleSheet, View } from 'react-native';

export function VerseOfTheDay() {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <IconSymbol name="book.fill" size={24} color="#808080" />
        <ThemedText type="subtitle" style={styles.headerText}>Verse of the Day</ThemedText>
      </View>
      
      <View style={styles.content}>
        <ThemedText style={styles.hebrewText}>בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃</ThemedText>
        <ThemedText style={styles.translationText}>
          In the beginning God created the heaven and the earth.
        </ThemedText>
        <ThemedText style={styles.reference}>Genesis 1:1</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Add a subtle border for better definition in dark mode/light mode
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  headerText: {
    marginLeft: 8,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    gap: 12,
  },
  hebrewText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    writingDirection: 'rtl',
  },
  translationText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  reference: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: 8,
    opacity: 0.6,
    fontWeight: '600',
  },
});
