import 'react-native-reanimated';
import "../global.css";

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from "react";
import { Platform, StyleSheet } from "react-native";

export const unstable_settings = {
  anchor: '(tabs)',
};

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    // UI Font
    'Rubik': require('../assets/fonts/Rubik-VariableFont_wght.ttf'),
    
    // Scripture Font (Biblical Hebrew)
    'TaameyFrank': require('../assets/fonts/TaameyFrankCLM-Medium.ttf'),
    'TaameyFrank-Bold': require('../assets/fonts/TaameyFrankCLM-Bold.ttf'),
  });

  const colorScheme = useColorScheme();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // --- UPDATED NAVIGATION BAR LOGIC ---
  useEffect(() => {
    if (Platform.OS === 'android') {
      // 1. Set the position to absolute so the app content (Tab Bar) draws behind it
      NavigationBar.setPositionAsync('absolute');
      
      // 2. Set the background to fully transparent
      NavigationBar.setBackgroundColorAsync('#ffffff00');
      
      // 3. Set the icon style (dark icons for light mode, light icons for dark mode)
      const buttonStyle = colorScheme === 'dark' ? 'light' : 'dark';
      NavigationBar.setButtonStyleAsync(buttonStyle);
    }
  }, [colorScheme]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SQLiteProvider databaseName="tanakh.db" assetSource={{ assetId: require('../assets/tanakh.db') }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </SQLiteProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
