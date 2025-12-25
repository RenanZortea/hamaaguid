import { PageTransition } from '@/components/PageTransition';
import { StudyCard } from '@/components/StudyCard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sample data for studies
const SAMPLE_STUDIES = [
  {
    id: '1',
    title: 'פרשת בראשית',
    description: 'לימוד עמוק על בריאת העולם',
    imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=200',
  },
  {
    id: '2',
    title: 'תהילים קי״ט',
    description: 'המזמור הארוך ביותר בתנ״ך',
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200',
  },
  {
    id: '3',
    title: 'משלי שלמה',
    description: 'חכמת המלך שלמה',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200',
  },
  {
    id: '4',
    title: 'ספר יונה',
    description: 'סיפור הנביא והלוויתן',
    imageUrl: 'https://images.unsplash.com/photo-1518281361980-b26bfd556770?w=200',
  },
  {
    id: '5',
    title: 'עשרת הדיברות',
    description: 'יסודות התורה והמצוות',
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=200',
  },
];

export interface StudyItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export default function StudyScreen() {
  const currentTheme = useColorScheme();
  const theme = currentTheme ?? 'light';

  const renderItem = ({ item }: { item: StudyItem }) => (
    <StudyCard data={item} />
  );

  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2">
      <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        לימוד
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 mb-6">
        העשיר את הידע שלך בתורה
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View className="py-10 items-center">
      <Text className="text-gray-500 dark:text-gray-400">
        לא נמצאו לימודים
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={theme === 'dark' ? ['#171717', '#262626'] : ['#e5e5e5', '#ffffff']}
      className="flex-1"
    >
      <PageTransition>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 w-full max-w-[600px] self-center relative">
            <FlashList
              data={SAMPLE_STUDIES}
              renderItem={renderItem}
              estimatedItemSize={80}
              ListHeaderComponent={renderHeader}
              ListFooterComponent={<View className="h-40" />}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
            
            {/* FAB */}
            <TouchableOpacity
              onPress={() => router.push('/create-study')}
              className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg active:bg-blue-700"
              style={{ elevation: 5 }}
            >
              <Plus size={28} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </PageTransition>
    </LinearGradient>
  );
}
