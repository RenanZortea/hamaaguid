import { GlassCard } from '@/components/GlassCard';
import { Skeleton } from '@/components/Skeleton';
import { Text, View } from 'react-native';

interface VerseDate {
  verseText: string;
  verseReference: string;
}

interface VerseOfTheDayProps {
  data?: VerseDate | null;
  loading?: boolean;
}

export function VerseOfTheDay({ data, loading }: VerseOfTheDayProps) {
  if (loading) {
    return (
      <GlassCard title="פסוק היום">
        <View className="gap-3 items-center">
          <Skeleton height={32} width="90%" />
          <Skeleton height={32} width="70%" />
          <View className="w-full flex-row justify-end mt-2">
            <Skeleton height={20} width="30%" />
          </View>
        </View>
      </GlassCard>
    );
  }

  // Default fallback if no data is provided or loaded yet
  const verseText = data?.verseText || "בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃";
  const verseReference = data?.verseReference || "בראשית א:א";

  return (
    <GlassCard title="פסוק היום">
      <View className="gap-3">
        <Text 
          className="text-2xl font-bold text-center leading-8 text-gray-900 dark:text-white"
          style={{ writingDirection: 'rtl' }}
        >
          {verseText}
        </Text>
        <Text className="text-sm text-right mt-2 opacity-60 font-semibold text-gray-600 dark:text-gray-400">
          {verseReference}
        </Text>
      </View>
    </GlassCard>
  );
}
