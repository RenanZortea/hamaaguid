import { PageTransition } from '@/components/PageTransition';
import { TimelineItem } from '@/components/TimelineItem';
import { TimelineTextItem } from '@/components/TimelineTextItem';
import { TimelineVerseItem } from '@/components/TimelineVerseItem';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toHebrewNumeral } from '@/utils/hebrewNumerals';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { AlignLeft, BookOpen } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TimelineDataType = {
  id: string;
  type: 'text' | 'verse';
  content: string;
  reference?: string;
};

export default function CreateStudyScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const isDark = theme === 'dark';

  const [items, setItems] = useState<TimelineDataType[]>([
    { id: '1', type: 'text', content: '' },
  ]);

  const params = useLocalSearchParams();

  /* Listen for returned verse selection */
  useEffect(() => {
      if (params.selectedBook && params.selectedText) {
          // We need a way to know WHICH item started the request.
          // For simplicity, we'll append a new Verse item if we don't have a targeted ID,
          // OR we could pass the ID in the params chain. 
          
          // Let's refine the flow to pass the item ID if editing, or just add new.
          // For now, let's just add a NEW verse item with this data.
          
          const newVerse: TimelineDataType = {
              id: Date.now().toString(),
              type: 'verse',
              reference: `${params.selectedBook} ${toHebrewNumeral(Number(params.selectedChapter))}:${toHebrewNumeral(Number(params.selectedVerse))}`,
              content: params.selectedText as string
          };
          
          setItems(prev => [...prev, newVerse]);
          
          // Clear params to avoid double-adding on re-renders (a bit hacky in Expo Router, 
          // usually we'd use a store or just check if ID exists, but let's try this first).
          router.setParams({ selectedBook: '', selectedText: '' });
      }
  }, [params.selectedBook, params.selectedText]);

  const addItem = (type: 'text' | 'verse') => {
    if (type === 'verse') {
        router.push({
            pathname: '/book-selection',
            params: { 
                returnTo: '/create-study',
                selectionMode: 'true'
            }
        });
        return;
    }
  
    const newItem: TimelineDataType = {
      id: Date.now().toString(),
      type: 'text',
      content: '',
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, text: string) => {
    setItems(items.map(item => item.id === id ? { ...item, content: text } : item));
  };

  return (
    <LinearGradient
      colors={isDark ? ['#171717', '#262626'] : ['#F3F4F6', '#FFFFFF']}
      className="flex-1"
    >
      <PageTransition>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          {/* Header */}
          <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-200 dark:border-gray-800">
             <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-600 dark:text-blue-400 text-base font-medium">ביטול</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">יצירת לימוד</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-600 dark:text-blue-400 text-base font-bold">שמור</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
            <View className="flex-1 max-w-[600px] w-full self-center">
              
              {/* Title Input */}
               <View className="mb-8">
                <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  כותרת הלימוד
                </Text>
                <Text className="text-base text-gray-500 dark:text-gray-400">
                  הוסף תיאור קצר ללימוד שלך
                </Text>
               </View>

              {/* Timeline Container */}
              <View>
                {items.map((item, index) => (
                  <TimelineItem key={item.id} isLast={index === items.length - 1}>
                    {item.type === 'text' ? (
                      <TimelineTextItem
                        value={item.content}
                        onChangeText={(text) => updateItem(item.id, text)}
                      />
                    ) : (
                      <TimelineVerseItem
                        reference={item.reference}
                        text={item.content}
                      />
                    )}
                  </TimelineItem>
                ))}
              </View>

              {/* Add Buttons */}
              <View className="flex-row justify-center mt-8 gap-4">
                <TouchableOpacity
                  onPress={() => addItem('text')}
                  className="flex-row items-center bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <AlignLeft size={20} color={isDark ? '#9CA3AF' : '#4B5563'} style={{ marginRight: 8 }} />
                  <Text className="font-medium text-gray-700 dark:text-gray-300">טקסט</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => addItem('verse')}
                  className="flex-row items-center bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-full shadow-sm border border-blue-100 dark:border-blue-800"
                >
                  <BookOpen size={20} color={isDark ? '#60A5FA' : '#2563EB'} style={{ marginRight: 8 }} />
                  <Text className="font-medium text-blue-700 dark:text-blue-400">פסוק</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </SafeAreaView>
      </PageTransition>
    </LinearGradient>
  );
}
