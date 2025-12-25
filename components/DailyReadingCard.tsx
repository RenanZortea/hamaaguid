import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReadingPlan } from '@/hooks/useReadingPlan';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Skeleton } from './Skeleton';

interface DailyReadingCardProps {
  loading?: boolean;
}

export function DailyReadingCard({ loading: parentLoading }: DailyReadingCardProps) {
  const router = useRouter();
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  
  const { progress, loading, markComplete } = useReadingPlan(db);

  const handlePress = () => {
    if (progress) {
      router.push({
        pathname: '/(tabs)/reader',
        params: { book: progress.bookName, chapter: progress.chapter }
      });
    }
  };

  const handleMarkComplete = () => {
     if (progress?.isCompleted) return;

     Alert.alert(
         'סיימת את הפרק?',
         `האם לסמן את ${progress?.bookName} פרק ${progress?.chapter} כנקרא?`,
         [
             { text: 'ביטול', style: 'cancel' },
             { text: 'כן, סיימתי', onPress: async () => {
                 await markComplete();
             }}
         ]
     );
  };

  const isComplete = progress?.isCompleted;
  const isLoading = loading || parentLoading;

  return (
    <View className="mx-4 my-2 min-h-[140px] bg-white dark:bg-neutral-900 rounded-2xl p-5">
      {/* Header */}
      <View className="flex-row">
        <Text className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold">
          קריאה יומית
        </Text>
      </View>

      {/* Content */}
      <View className="flex-row items-center justify-between flex-1">
        {/* Text content */}
        <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handlePress}
            className="flex-1"
            disabled={isLoading}
        >
          {isLoading ? (
            <View className="gap-2">
              <Skeleton height={28} width="70%" />
              <Skeleton height={14} width="40%" />
            </View>
          ) : (
            <>
              <Text 
                className={`text-2xl font-bold ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`} 
                style={{ writingDirection: 'rtl' }}
              >
                {isComplete ? 'הושלם!' : `${progress?.bookName} ${progress ? numberToHebrew(progress.chapter) : ''}`}
              </Text>
              <Text 
                className="text-sm text-gray-500 dark:text-gray-400 mt-1" 
                style={{ writingDirection: 'rtl' }}
              >
                {isComplete ? `${progress?.bookName} ${progress ? numberToHebrew(progress.chapter) : ''}` : 'לחץ לקריאה'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Checkmark icon button */}
        {!isLoading && (
          <TouchableOpacity 
              onPress={handleMarkComplete}
              disabled={isComplete}
              className="p-3 rounded-full active:bg-gray-100 dark:active:bg-neutral-800"
              style={{ opacity: isComplete ? 0.5 : 1 }}
          >
              <Ionicons 
                name={isComplete ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={32} 
                color={isComplete ? '#10b981' : Colors[theme].tint} 
              />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Simple helper for Hebrew numerals (simplified for chapter numbers 1-150)
function numberToHebrew(num: number): string {
    const gematria: {[key: number]: string} = {
        1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט', 10: 'י',
        20: 'כ', 30: 'ל', 40: 'מ', 50: 'נ', 60: 'ס', 70: 'ע', 80: 'פ', 90: 'צ', 100: 'ק',
        200: 'ר', 300: 'ש', 400: 'ת'
    };
    
    if (num <= 10) return gematria[num];
    
    if (num < 20) {
        if (num === 15) return 'טו';
        if (num === 16) return 'טז';
        return 'י' + gematria[num - 10];
    }

    const tens = Math.floor(num / 10) * 10;
    const units = num % 10;
    
    if (units === 0) return gematria[tens] || '';

    return (gematria[tens] || '') + (gematria[units] || '');
}
