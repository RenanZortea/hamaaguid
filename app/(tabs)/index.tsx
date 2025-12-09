import { EmptyCard } from '@/components/EmptyCard';
import { ThemedView } from '@/components/themed-view';
import { VerseOfTheDay } from '@/components/VerseOfTheDay';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const data = new Array(10).fill(0); // 10 empty cards

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.listContainer}>
          <FlashList
            data={data}
            renderItem={() => <EmptyCard />}
            estimatedItemSize={100}
            ListHeaderComponent={() => (
              <View style={styles.headerContainer}>
                <VerseOfTheDay />
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600, // Constrain width on tablets/web
    alignSelf: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 10,
  },
});
