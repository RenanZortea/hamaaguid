import { GlassCard } from '@/components/GlassCard';
import { Text, View } from 'react-native';

export function VerseOfTheDay() {
  return (
    <GlassCard title="פסוק היום">
      <View className="gap-3">
        <Text 
          className="text-2xl font-bold text-center leading-8 text-gray-900 dark:text-white"
          style={{ writingDirection: 'rtl' }}
        >
          בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃
        </Text>
        <Text className="text-sm text-right mt-2 opacity-60 font-semibold text-gray-600 dark:text-gray-400">
          ברשית א:א
        </Text>
      </View>
    </GlassCard>
  );
}
