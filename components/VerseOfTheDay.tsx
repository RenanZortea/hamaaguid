import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text, View } from 'react-native';

export function VerseOfTheDay() {
  return (
    <View className="p-5 rounded-2xl m-4 shadow-md border border-gray-200/30 dark:border-gray-600/30 bg-white dark:bg-neutral-800">
      {/* Header */}
      <View className="flex-row items-center mb-4 opacity-70">
        <IconSymbol name="book.fill" size={24} color="#808080" />
        <Text className="ml-2 text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400 font-medium">
          Verse of the Day
        </Text>
      </View>
      
      {/* Content */}
      <View className="gap-3">
        <Text 
          className="text-2xl font-bold text-center leading-8 text-gray-900 dark:text-white"
          style={{ writingDirection: 'rtl' }}
        >
          בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃
        </Text>
        <Text className="text-base text-center italic opacity-80 text-gray-700 dark:text-gray-300">
          In the beginning God created the heaven and the earth.
        </Text>
        <Text className="text-sm text-right mt-2 opacity-60 font-semibold text-gray-600 dark:text-gray-400">
          Genesis 1:1
        </Text>
      </View>
    </View>
  );
}
