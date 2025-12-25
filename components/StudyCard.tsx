import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface StudyCardProps {
  data: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
  };
}

export function StudyCard({ data }: StudyCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handlePress = () => {
    // TODO: Navigate to study detail page
    router.push({
      pathname: '/daily-study',
      params: {
        title: data.title,
        description: data.description,
        content: '',
      },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      className="mx-4 my-2 bg-gray-100 dark:bg-neutral-800 rounded-xl overflow-hidden flex-row h-24"
    >
      {/* Image on the right side - native RTL handles this */}
      <Image
        source={{ uri: data.imageUrl }}
        className="w-24 h-24"
        resizeMode="cover"
      />

      {/* Content */}
      <View className="flex-1 px-4 py-3 justify-center">
        <Text
          className="text-lg font-bold text-black dark:text-white"
          numberOfLines={1}
        >
          {data.title}
        </Text>
        <Text
          className="text-sm text-gray-600 dark:text-gray-400 mt-1"
          numberOfLines={2}
        >
          {data.description}
        </Text>
      </View>

      {/* Action button */}
      <View className="w-14 items-center justify-center">
        <View className="w-9 h-9 rounded-full bg-black dark:bg-white items-center justify-center">
          <Ionicons name="chevron-back" size={22} color={colorScheme === 'dark' ? 'black' : 'white'} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
