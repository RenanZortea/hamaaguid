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
  const title = data?.devotionalTitle || "לימוד יומי";
  const content = hasDescription || 'בקרוב';

  return (
    <GlassCard title={title}>
      <View className="min-h-[96px] justify-center items-center p-2">
        <Text 
          className={`text-gray-900 dark:text-white ${hasDescription ? 'text-right w-full text-base leading-6' : 'opacity-50 italic text-gray-500 dark:text-gray-400'}`}
          numberOfLines={hasDescription ? 4 : undefined}
        >
          {content}
        </Text>
      </View>
    </GlassCard>
  );
}
