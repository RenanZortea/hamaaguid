// import 'react-native-reanimated'; // Temporarily disabled - requires native rebuild
import "../global.css";

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/use-color-scheme';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from "react";
import { Platform } from "react-native";

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backgroundColor = colorScheme === 'dark' ? '#151718' : '#ffffff';
      const buttonStyle = colorScheme === 'dark' ? 'light' : 'dark';
      NavigationBar.setBackgroundColorAsync(backgroundColor);
      NavigationBar.setButtonStyleAsync(buttonStyle);
    }
  }, [colorScheme]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName="bible.db" assetSource={{ assetId: require('../assets/bible.db') }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </SQLiteProvider>
    </ThemeProvider>
  );
}
