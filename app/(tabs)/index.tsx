import { AnimatedSearch } from '@/components/AnimatedSearch';
import { DailyReadingCard } from '@/components/DailyReadingCard';
import { DailyStudyCard } from '@/components/DailyStudyCard';
import { PageTransition } from '@/components/PageTransition';
import { PrayersCard } from '@/components/PrayersCard';
import { SearchBar } from '@/components/SearchBar';
import { VerseOfTheDay } from '@/components/VerseOfTheDay';
import { db as firestoreDb } from '@/config/firebaseConfig';
// CHANGE 1: Import SearchResult from useOramaSearch (or keep shared interface)
// CHANGE 2: Import useOramaSearch instead of useUnifiedSearch
import { SearchResult, useOramaSearch } from '@/hooks/useOramaSearch';
import { fetchVerseFromReference } from '@/utils/bibleUtils';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const currentTheme = useColorScheme();
    const router = useRouter();
    const db = useSQLiteContext();
  
    // 1. Setup Search State
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // CHANGE 3: Use the Orama hook which now supports loadMore
    const { results: searchResults, loading: searchLoading } = useOramaSearch(searchQuery);
  
    // Daily Verse State
    const [dailyVerse, setDailyVerse] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
  
    const fetchDailyContent = async () => {
      // Format today's date to match your ID format, e.g., "2023-10-27"
      const today = new Date().toISOString().split('T')[0]; 
      
      try {
        const docRef = doc(firestoreDb, 'daily_content', today);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          
          // If we have a reference but no text (or even if we have text, we might want to refresh it from local DB)
          // The admin now only saves 'verseReference'.
          if (data.verseReference) {
             const fetchedData = await fetchVerseFromReference(db, data.verseReference);
             if (fetchedData) {
                 data.verseText = fetchedData.text; // Inject the text
             }
          }
  
          setDailyVerse(data);
        } else {
          // Optional: Fallback to a default verse if admin hasn't posted yet
        }
      } catch (error) {
        console.error("Error fetching daily verse:", error);
      } finally {
        // Ensure loading is set to false after initial fetch
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchDailyContent();
    }, [db]);
  
    const onRefresh = async () => {
      setRefreshing(true);
      await fetchDailyContent();
      setRefreshing(false);
    };
  
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
                  const isLoading = loading && !dailyVerse;
  
                  if (item.type === 'verse') {
                    return <VerseOfTheDay data={dailyVerse} loading={isLoading} />;
                  }
                  
                  if (item.id === 'study') {
                      return <DailyStudyCard data={dailyVerse} loading={isLoading} />;
                  }
  
                  if (item.id === 'reading') {
                      return <DailyReadingCard loading={isLoading} />;
                  }
  
                  if (item.id === 'prayers') {
                      return <PrayersCard loading={isLoading} />;
                  }
                  
                  return null;
                }}
                estimatedItemSize={200}
                contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme === 'dark' ? '#fff' : '#000'} />
                }
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
        />
      </LinearGradient>
    );
  }
