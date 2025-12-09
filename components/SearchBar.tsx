import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TextInput, TextInputProps, View } from 'react-native';

export function SearchBar(props: TextInputProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = Colors[theme].icon;
  const textColor = Colors[theme].text;
  const placeholderColor = '#8E8E93';

  return (
    <View className="flex-row items-center rounded-xl px-3 py-2 mx-4 mb-2 bg-gray-200 dark:bg-neutral-700">
      <IconSymbol
        name="magnifyingglass"
        size={20}
        color={iconColor}
        style={{ marginRight: 6 }}
      />
      <TextInput
        className="flex-1 text-lg py-0 text-gray-900 dark:text-white"
        placeholderTextColor={placeholderColor}
        placeholder="Search..."
        {...props}
      />
    </View>
  );
}
