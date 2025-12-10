import { Text, View } from 'react-native';

export function EmptyCard() {
  return (
    <View className="h-24 rounded-xl my-2 mx-4 justify-center items-center border border-gray-300/30 dark:border-gray-600/30 opacity-50 bg-gray-100 dark:bg-neutral-800">
      <Text className="opacity-50 italic text-gray-500 dark:text-gray-400">
        בקרוב
      </Text>
    </View>
  );
}
