import { GlassCard } from '@/components/GlassCard';
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

  if (loading || parentLoading) {
    return (
      <GlassCard className="min-h-[140px]">
         <View className="p-4 gap-2">
            <Skeleton width="40%" height={20} />
            <Skeleton width="70%" height={32} />
            <Skeleton width="30%" height={16} />
         </View>
      </GlassCard>
    );
  }

  const handlePress = () => {
    if (progress) {
      router.push({
        pathname: '/(tabs)/reader',
        params: { book: progress.bookName, chapter: progress.chapter }
      });
    }
  };

  const handleMarkComplete = () => {
     if (progress?.isCompleted) return; // Already done

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

  return (
    <GlassCard className="min-h-[140px]">
      <View className="p-1 flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-2 px-2 pt-2">
             <Text className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium text-right w-full">
               קריאה יומית
             </Text>
        </View>

        <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handlePress}
            className="flex-1 justify-center items-center py-2"
        >
             <Text className={`text-3xl font-bold ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`} style={{ writingDirection: 'rtl' }}>
               {isComplete ? 'הושלם!' : `${progress?.bookName} ${progress ? numberToHebrew(progress.chapter) : ''}`}
             </Text>
             <Text className="text-sm text-gray-500 mt-1">
               {isComplete ? `${progress?.bookName} ${progress ? numberToHebrew(progress.chapter) : ''}` : 'לחץ לקריאה'}
             </Text>
        </TouchableOpacity>

        {/* Footer Actions */}
        <View className="flex-row justify-start mt-2 px-2 pb-1 border-t border-gray-100/100 pt-2 dark:border-gray-800">
            <TouchableOpacity 
                onPress={handleMarkComplete}
                disabled={isComplete}
                className="flex-row items-center gap-2 p-2 rounded-lg active:bg-gray-100 dark:active:bg-gray-800"
                style={{ opacity: isComplete ? 0.5 : 1 }}
            >
                <Ionicons 
                  name={isComplete ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={20} 
                  color={isComplete ? '#10b981' : Colors[theme].tint} 
                />
                <Text style={{ color: isComplete ? '#10b981' : Colors[theme].tint }} className="font-medium">
                    {isComplete ? 'בוצע להיום' : 'סמן כנקרא'}
                </Text>
            </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );
}

// Simple helper for Hebrew numerals (simplified for chapter numbers 1-150)
function numberToHebrew(num: number): string {
    const gematria: {[key: number]: string} = {
        1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט', 10: 'י',
        20: 'כ', 30: 'ל', 40: 'מ', 50: 'נ', 60: 'ס', 70: 'ע', 80: 'פ', 90: 'צ', 100: 'ק',
        200: 'ר', 300: 'ש', 400: 'ת'
    };
    
    // Very basic implementation for demo, you might want to use your full library
    if (num <= 10) return gematria[num];
    
    // For 11-19
    if (num < 20) {
        if (num === 15) return 'טו';
        if (num === 16) return 'טז';
        return 'י' + gematria[num - 10];
    }

    // For 20+ generic
    const tens = Math.floor(num / 10) * 10;
    const units = num % 10;
    
    // If exact tens
    if (units === 0) return gematria[tens] || '';

    // Handle 15/16 composite logic if needed, but for now simple concatenation
    return (gematria[tens] || '') + (gematria[units] || '');
}
