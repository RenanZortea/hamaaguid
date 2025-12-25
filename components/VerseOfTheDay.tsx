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
  // Default fallback if no data is provided or loaded yet
  const verseText = data?.verseText || "בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃";
  const verseReference = data?.verseReference || "בראשית א:א";

  return (
    <View className="mx-4 my-2 min-h-[220px] bg-white dark:bg-neutral-900 rounded-2xl p-5">
      {/* Header */}
      <View className="flex-row">
        <Text className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold">
          פסוק היום
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center py-4">
        {loading ? (
          <View className="w-full items-center gap-3">
            <Skeleton height={28} width="90%" />
            <Skeleton height={28} width="70%" />
          </View>
        ) : (
          <Text 
            className="text-2xl font-bold text-center leading-10 text-gray-900 dark:text-white"
            style={{ writingDirection: 'rtl' }}
          >
            {verseText}
          </Text>
        )}
      </View>

      {/* Footer */}
      <View className="mt-auto pt-3">
        {loading ? (
          <Skeleton height={16} width="25%" />
        ) : (
          <Text className="text-sm font-medium text-gray-500 dark:text-gray-400" style={{ writingDirection: 'rtl' }}>
            {verseReference}
          </Text>
        )}
      </View>
    </View>
  );
}

