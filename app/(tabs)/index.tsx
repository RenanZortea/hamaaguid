import { AnimatedSearch } from '@/components/AnimatedSearch';
import { GlassCard } from '@/components/GlassCard';
import { PageTransition } from '@/components/PageTransition';
import { SearchBar } from '@/components/SearchBar';
import { VerseOfTheDay } from '@/components/VerseOfTheDay';
import { db } from '@/config/firebaseConfig';
// CHANGE 1: Import SearchResult from useOramaSearch (or keep shared interface)
// CHANGE 2: Import useOramaSearch instead of useUnifiedSearch
import { SearchResult, useOramaSearch } from '@/hooks/useOramaSearch';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const currentTheme = useColorScheme();
  const router = useRouter();

  // 1. Setup Search State
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // CHANGE 3: Use the Orama hook which now supports loadMore
  const { results: searchResults, loading: searchLoading, loadMore } = useOramaSearch(searchQuery);

  // Daily Verse State
  const [dailyVerse, setDailyVerse] = useState(null);

  useEffect(() => {
    const fetchDailyContent = async () => {
      // Format today's date to match your ID format, e.g., "2023-10-27"
      const today = new Date().toISOString().split('T')[0]; 
      
      try {
        const docRef = doc(db, 'daily_content', today);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDailyVerse(docSnap.data() as any);
        } else {
          // Optional: Fallback to a default verse if admin hasn't posted yet
        }
      } catch (error) {
        console.error("Error fetching daily verse:", error);
      }
    };

    fetchDailyContent();
  }, []);

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

  const listItems = [
    { id: 'verse', type: 'verse' },
    { id: 'study', title: 'לימוד יומי', content: 'בקרוב' },
    { id: 'reading', title: 'קריאה יומית', content: 'בקרוב' },
    { id: 'prayers', title: 'תפילות', content: 'בקרוב' },
  ];

  return (
    <LinearGradient
      colors={currentTheme === 'dark' ? ['#171717', '#262626'] : ['#e5e5e5', '#ffffff']}
      className="flex-1"
    >
      <PageTransition>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 w-full max-w-[600px] self-center">
            <FlashList
              data={listItems}
              renderItem={({ item }) => {
                if (item.type === 'verse') {
                  return <VerseOfTheDay data={dailyVerse} />;
                }
                
                // Special rendering for 'study' card to show fetched content
                if (item.id === 'study') {
                    const hasStudyContent = dailyVerse?.devotionalContent;
                    return (
                        <GlassCard title={dailyVerse?.devotionalTitle || item.title}>
                            <View className="min-h-[96px] justify-center items-center p-2">
                                <Text 
                                    className={`text-gray-900 dark:text-white ${hasStudyContent ? 'text-right w-full text-base leading-6' : 'opacity-50 italic text-gray-500 dark:text-gray-400'}`}
                                    numberOfLines={hasStudyContent ? 4 : undefined}
                                >
                                {hasStudyContent || item.content}
                                </Text>
                            </View>
                        </GlassCard>
                    );
                }

                return (
                  <GlassCard title={item.title}>
                     <View className="h-24 justify-center items-center">
                        <Text className="opacity-50 italic text-gray-500 dark:text-gray-400">
                          {item.content}
                        </Text>
                     </View>
                  </GlassCard>
                );
              }}
              estimatedItemSize={200}
              contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
          
          {/* 3. Search Bar Trigger */}
          <Pressable 
            onPress={() => setSearchVisible(true)}
            style={{ opacity: searchVisible ? 0 : 1 }} 
          >
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
