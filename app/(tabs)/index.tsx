import { AnimatedSearch } from '@/components/AnimatedSearch';
import { EmptyCard } from '@/components/EmptyCard';
import { PageTransition } from '@/components/PageTransition';
import { SearchBar } from '@/components/SearchBar';
import { VerseOfTheDay } from '@/components/VerseOfTheDay';
import { SearchResult, useUnifiedSearch } from '@/hooks/useBible';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const currentTheme = useColorScheme();
  const router = useRouter();

  // 1. Setup Search State
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults, loading: searchLoading, loadMore } = useUnifiedSearch(searchQuery);

  // 2. Handle Navigation when an item is selected
  const handleSearchSelect = (item: SearchResult) => {
    setSearchVisible(false);
    setSearchQuery('');

    // Navigate to Reader with params
    if (item.type === 'book') {
      router.push({
        pathname: '/(tabs)/reader',
        params: { book: item.label, chapter: 1 }
      });
    } else {
      router.push({
        pathname: '/(tabs)/reader',
        params: { 
          book: item.data.book_name, 
          chapter: item.data.chapter,
          highlightVerse: item.data.verse 
        }
      });
    }
  };

  const data = new Array(10).fill(0); // 10 empty cards

  return (
    <LinearGradient
      colors={currentTheme === 'dark' ? ['#171717', '#262626'] : ['#e5e5e5', '#ffffff']}
      className="flex-1"
    >
      <PageTransition>
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
          
          {/* 3. Search Bar Trigger 
              We wrap it in a Pressable and disable editing on the input itself
              so it acts like a button to open the overlay.
          */}
          <Pressable onPress={() => setSearchVisible(true)}>
            <View pointerEvents="none">
              <SearchBar editable={false} />
            </View>
          </Pressable>
        </SafeAreaView>
      </PageTransition>

      {/* 4. The Animated Search Overlay */}
      <AnimatedSearch 
        visible={searchVisible}
        onCancel={() => {
          setSearchVisible(false);
          setSearchQuery('');
        }}
        results={searchResults}
        loading={searchLoading}
        onSearchChange={setSearchQuery}
        onSelect={handleSearchSelect}
        onLoadMore={loadMore}
      />
    </LinearGradient>
  );
}
