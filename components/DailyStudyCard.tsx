import { GlassCard } from '@/components/GlassCard';
import { Skeleton } from '@/components/Skeleton';
import { Text, View } from 'react-native';

interface DailyStudyData {
  devotionalTitle?: string;
  devotionalDescription?: string;
}

interface DailyStudyCardProps {
  data?: DailyStudyData | null;
  loading?: boolean;
}

export function DailyStudyCard({ data, loading }: DailyStudyCardProps) {
  if (loading) {
    return (
      <GlassCard title="לימוד יומי">
        <View className="min-h-[96px] justify-center items-center p-2 gap-2 w-full">
          <Skeleton width="100%" height={20} />
          <Skeleton width="90%" height={20} />
          <Skeleton width="60%" height={20} style={{ alignSelf: 'flex-end' }} />
        </View>
      </GlassCard>
    );
  }

  const hasDescription = data?.devotionalDescription;

  const content = hasDescription || 'בקרוב';

  return (
    <GlassCard title="לימוד יומי">
      <View className="p-4 gap-2">
        {data?.devotionalTitle && (
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.devotionalTitle}
          </Text>
        )}
        <Text 
          className={`text-base leading-6 ${hasDescription ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 opacity-50 italic'}`}
          numberOfLines={hasDescription ? undefined : 2}
        >
          {content}
        </Text>
      </View>
    </GlassCard>
  );
}
