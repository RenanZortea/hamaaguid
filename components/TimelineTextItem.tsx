import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { TextInput, View } from 'react-native';

interface TimelineTextItemProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function TimelineTextItem({ value, onChangeText, placeholder = "Write something..." }: TimelineTextItemProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const isDark = theme === 'dark';

  return (
    <View className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
        multiline
        className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />
    </View>
  );
}
