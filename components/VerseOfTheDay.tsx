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
      <GlassCard className="min-h-[220px]">
        <View className="flex-1 justify-between p-2">
          <View className="flex-row mb-4 opacity-70">
             <Text className="text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400 font-medium">
               פסוק היום
             </Text>
          </View>
          <View className="items-center justify-center flex-1 gap-3">
             <Skeleton height={32} width="90%" />
             <Skeleton height={32} width="70%" />
          </View>
          <View className="w-full flex-row mt-4">
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
    <GlassCard className="min-h-[220px]">
      <View className="flex-1 justify-between p-2">
        <View className="flex-row mb-2 opacity-70">
           <Text className="text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400 font-medium">
             פסוק היום
           </Text>
        </View>

        <View className="flex-1 justify-center my-2">
          <Text 
            className="text-2xl font-bold text-center leading-9 text-gray-900 dark:text-white"
            style={{ writingDirection: 'rtl' }}
          >
            {verseText}
          </Text>
        </View>

        <Text className="text-sm mt-2 opacity-60 font-semibold text-gray-600 dark:text-gray-400">
          {verseReference}
        </Text>
      </View>
    </GlassCard>
  );
}
