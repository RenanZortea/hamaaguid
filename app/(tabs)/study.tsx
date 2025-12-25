import { DailyStudyCard } from '@/components/DailyStudyCard';
import { PageTransition } from '@/components/PageTransition';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DailyStudy, useDailyStudies } from '@/hooks/useDailyStudies';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudyScreen() {
  const currentTheme = useColorScheme();
  const theme = currentTheme ?? 'light';
  
  const { data, loading, loadingMore, hasMore, refresh, fetchMore } = useDailyStudies();

  const renderItem = ({ item }: { item: DailyStudy }) => (
    <DailyStudyCard data={item} loading={false} />
  );

  const renderFooter = () => {
    if (!loadingMore) return <View className="h-40" />; // Add bottom padding
    return (
      <View className="py-4 items-center h-40">
        <ActivityIndicator size="small" color={Colors[theme].tint} />
      </View>
    );
  };

  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2">
      <Text className="text-3xl font-bold text-gray-900 dark:text-white text-right mb-1">
        לימוד
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-right mb-6">
        העשיר את הידע שלך בתורה
      </Text>
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
       // Skeleton loading state
        return (
            <View>
                 <DailyStudyCard loading={true} />
                 <DailyStudyCard loading={true} />
                 <DailyStudyCard loading={true} />
            </View>
        );
    }
    return (
      <View className="py-10 items-center">
        <Text className="text-gray-500 dark:text-gray-400">
          לא נמצאו לימודים
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={theme === 'dark' ? ['#171717', '#262626'] : ['#e5e5e5', '#ffffff']}
      className="flex-1"
    >
      <PageTransition>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 w-full max-w-[600px] self-center">
            <FlashList
              data={data}
              renderItem={renderItem}
              estimatedItemSize={250}
              onEndReached={fetchMore}
              onEndReachedThreshold={0.5}
              ListHeaderComponent={renderHeader}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshControl={
                <RefreshControl refreshing={loading && !data.length} onRefresh={refresh} tintColor={Colors[theme].tint} />
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </PageTransition>
    </LinearGradient>
  );
}
