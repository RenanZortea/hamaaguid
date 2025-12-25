import { useColorScheme } from '@/hooks/use-color-scheme';
import { BookOpen } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface TimelineVerseItemProps {
  reference?: string; // e.g., "Genesis 1:1"
  text?: string;
}

export function TimelineVerseItem({ reference = "Select a Verse", text = "..." }: TimelineVerseItemProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const isDark = theme === 'dark';

  return (
    <View className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
      <View className={`px-4 py-2 flex-row items-center ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
        <BookOpen size={16} color={isDark ? '#60A5FA' : '#2563EB'} style={{ marginRight: 8 }} />
        <Text className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
          {reference}
        </Text>
      </View>
      <View className="p-4">
        <Text className={`text-base leading-6 font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
          {text}
        </Text>
      </View>
    </View>
  );
}
