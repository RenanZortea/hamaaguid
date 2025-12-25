import { Skeleton } from '@/components/Skeleton';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

interface DailyStudyData {
  devotionalTitle?: string;
  devotionalDescription?: string;
  devotionalContent?: string;
}

interface DailyStudyCardProps {
  data?: DailyStudyData | null;
  loading?: boolean;
}

export function DailyStudyCard({ data, loading }: DailyStudyCardProps) {
  const router = useRouter();
  
  // Default fallback content if no data is provided
  const title = data?.devotionalTitle || 'למה ללמוד תורה?';
  const description = data?.devotionalDescription || 'לימוד התורה מחזק את הקשר שלנו עם הקב״ה ומעשיר את חיינו בחכמה ובהבנה.';
  const content = data?.devotionalContent || '';

  const handlePress = () => {
    router.push({
      pathname: '/daily-study',
      params: {
        title,
        description,
        content,
      },
    });
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={loading}
      className="mx-4 my-2 min-h-[220px] bg-white dark:bg-neutral-900 rounded-2xl p-5"
    >
      {/* Header */}
      <View className="flex-row">
        <Text className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold">
          לימוד יומי
        </Text>
      </View>

      {/* Content - Vertically Centered */}
      <View className="flex-1 justify-center items-center py-4">
        {loading ? (
          <View className="w-full items-center gap-3">
            <Skeleton height={32} width="70%" />
            <Skeleton height={18} width="90%" />
            <Skeleton height={18} width="75%" />
          </View>
        ) : (
          <View className="gap-3 items-center">
            <Text 
              className="text-2xl font-bold text-center text-gray-900 dark:text-white" 
              style={{ writingDirection: 'rtl' }}
            >
              {title}
            </Text>
            <Text 
              className="text-base leading-7 text-center text-gray-600 dark:text-gray-300"
              style={{ writingDirection: 'rtl' }}
              numberOfLines={3}
            >
              {description}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
