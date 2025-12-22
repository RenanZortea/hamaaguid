import 'react-native-reanimated';
import "../global.css";

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { BibleProvider } from '@/contexts/BibleContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initUserDb } from '@/hooks/useUserDb';
import * as NavigationBar from 'expo-navigation-bar';
import * as Updates from 'expo-updates';
import { useEffect } from "react";
import { I18nManager, Platform, StyleSheet } from "react-native";

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

  // Check if RTL is enabled
  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
      // RTL changes require a restart to take effect
      if (Platform.OS !== 'web') {
        Updates.reloadAsync();
      }
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Initialize User DB (async)
      initUserDb().catch(e => console.error("Failed to init user db:", e));
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
          <BibleProvider>
            <FavoritesProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </FavoritesProvider>
          </BibleProvider>
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
