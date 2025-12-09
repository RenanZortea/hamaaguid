import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

export function SearchBar(props: TextInputProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = Colors[theme].icon;
  const backgroundColor = theme === 'light' ? '#E5E5EA' : '#2C2C2E'; // iOS-style search bar colors
  const textColor = Colors[theme].text;
  const placeholderColor = theme === 'light' ? '#8E8E93' : '#8E8E93';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <IconSymbol
        name="magnifyingglass"
        size={20}
        color={iconColor}
        style={styles.icon}
      />
      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholderTextColor={placeholderColor}
        placeholder="Search..."
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 0, // Remove default padding to stick to container padding
  },
});
