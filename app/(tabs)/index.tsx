import { EmptyCard } from '@/components/EmptyCard';
import { SearchBar } from '@/components/SearchBar';
import { VerseOfTheDay } from '@/components/VerseOfTheDay';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const data = new Array(10).fill(0); // 10 empty cards

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 w-full max-w-[600px] self-center">
          <FlashList
            data={data}
            renderItem={() => <EmptyCard />}
            estimatedItemSize={100}
            ListHeaderComponent={() => (
              <View className="mb-2.5">
                <VerseOfTheDay />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
        <SearchBar />
      </SafeAreaView>
    </View>
  );
}
