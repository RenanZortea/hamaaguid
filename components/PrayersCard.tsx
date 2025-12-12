import { GlassCard } from '@/components/GlassCard';
import { Text, View } from 'react-native';

interface PrayersCardProps {
  loading?: boolean;
}

export function PrayersCard({ loading }: PrayersCardProps) {
  return (
    <GlassCard title="תפילות">
      <View className="h-24 justify-center items-center">
        <Text className="opacity-50 italic text-gray-500 dark:text-gray-400">
          בקרוב
        </Text>
      </View>
    </GlassCard>
  );
}
