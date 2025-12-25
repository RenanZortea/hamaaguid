
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { ReadingSettings } from '@/hooks/useReadingSettings';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';

interface Props {
  settings: ReadingSettings;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  visible: boolean;
}

export function ReadingSettingsMenu({ settings, setFontSize, setFontFamily, visible }: Props) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  
  if (!visible) return null;

  return (
    <ThemedView style={styles.container}>
      {/* Title */}
      <ThemedText type="subtitle" style={styles.title} selectable={false}>הגדרות קריאה</ThemedText>

      {/* Font Size Control */}
      <View style={styles.row}>
        <ThemedText selectable={false}>גודל גופן</ThemedText>
        <View style={styles.controls}>
          <TouchableOpacity 
            onPress={() => setFontSize(Math.max(14, settings.fontSize - 2))}
            style={[styles.button, { backgroundColor: Colors[theme].icon + '20' }]}
          >
            <Ionicons name="remove" size={20} color={Colors[theme].text} />
          </TouchableOpacity>
          
          <ThemedText style={styles.valueText}>{settings.fontSize}</ThemedText>
          
          <TouchableOpacity 
            onPress={() => setFontSize(Math.min(48, settings.fontSize + 2))}
            style={[styles.button, { backgroundColor: Colors[theme].icon + '20' }]}
          >
            <Ionicons name="add" size={20} color={Colors[theme].text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Font Family Control */}
      {/* 
      <View style={styles.section}>
        <ThemedText style={styles.label}>Font Family</ThemedText>
        <View style={styles.fontList}>
          {AVAILABLE_FONTS.map((font) => (
            <TouchableOpacity
              key={font.value}
              onPress={() => setFontFamily(font.value)}
              style={[
                styles.fontOption,
                settings.fontFamily === font.value && { backgroundColor: Colors[theme].tint + '20' }
              ]}
            >
              <ThemedText 
                style={{ 
                  fontFamily: font.value,
                  color: settings.fontFamily === font.value ? Colors[theme].tint : Colors[theme].text 
                }}
              >
                {font.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 18,
    width: 40,
    textAlign: 'center',
  },
  section: {
    marginTop: 8,
  },
  label: {
    marginBottom: 8,
  },
  fontList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fontOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
