import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DailyStudyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const params = useLocalSearchParams<{
    title: string;
    description: string;
    content: string;
  }>();

  const title = params.title || 'לימוד יומי';
  const description = params.description || '';
  const content = params.content || '';

  // Markdown styles based on theme
  const markdownStyles = {
    body: {
      color: theme === 'dark' ? '#e5e5e5' : '#1f2937',
      fontSize: 18,
      lineHeight: 28,
      writingDirection: 'rtl' as const,
    },
    heading1: {
      color: theme === 'dark' ? '#ffffff' : '#111827',
      fontSize: 28,
      fontWeight: 'bold' as const,
      marginBottom: 16,
      marginTop: 24,
    },
    heading2: {
      color: theme === 'dark' ? '#ffffff' : '#111827',
      fontSize: 24,
      fontWeight: 'bold' as const,
      marginBottom: 12,
      marginTop: 20,
    },
    heading3: {
      color: theme === 'dark' ? '#ffffff' : '#111827',
      fontSize: 20,
      fontWeight: '600' as const,
      marginBottom: 8,
      marginTop: 16,
    },
    paragraph: {
      marginBottom: 16,
    },
    strong: {
      fontWeight: 'bold' as const,
    },
    em: {
      fontStyle: 'italic' as const,
    },
    blockquote: {
      backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6',
      borderLeftColor: Colors[theme].tint,
      borderLeftWidth: 4,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginVertical: 12,
    },
    list_item: {
      marginBottom: 8,
    },
  };

  return (
    <LinearGradient
      colors={theme === 'dark' ? ['#171717', '#262626'] : ['#e5e5e5', '#ffffff']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full active:bg-gray-100 dark:active:bg-neutral-800"
          >
            <Ionicons 
              name="arrow-forward" 
              size={24} 
              color={theme === 'dark' ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-semibold text-gray-900 dark:text-white text-right mr-2">
            לימוד יומי
          </Text>
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-5"
          contentContainerStyle={{ paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text 
            className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
            style={{ writingDirection: 'rtl' }}
          >
            {title}
          </Text>

          {/* Description */}
          {description ? (
            <Text 
              className="text-lg text-gray-600 dark:text-gray-300 mb-6"
              style={{ writingDirection: 'rtl' }}
            >
              {description}
            </Text>
          ) : null}

          {/* Divider */}
          <View className="h-px bg-gray-200 dark:bg-neutral-700 mb-6" />

          {/* Markdown Content */}
          {content ? (
            <Markdown style={markdownStyles}>
              {content}
            </Markdown>
          ) : (
            <Text 
              className="text-base text-gray-500 dark:text-gray-400 italic text-center py-8"
              style={{ writingDirection: 'rtl' }}
            >
              אין תוכן נוסף להיום
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
