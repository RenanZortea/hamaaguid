
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'reading_settings';

export interface ReadingSettings {
  fontSize: number;
  fontFamily: string;
}

export const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 24,
  fontFamily: 'TaameyFrank-Bold',
};

export const AVAILABLE_FONTS = [
  { label: 'Taamey Frank', value: 'TaameyFrank-Bold' },
  { label: 'Open Sans', value: 'OpenSans-Regular' }, 
  // Add other available fonts here if needed
];

export function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load reading settings', e);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: ReadingSettings) => {
    try {
      setSettings(newSettings);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save reading settings', e);
    }
  };

  const setFontSize = (size: number) => {
    saveSettings({ ...settings, fontSize: size });
  };

  const setFontFamily = (family: string) => {
    saveSettings({ ...settings, fontFamily: family });
  };

  const resetSettings = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    loading,
    setFontSize,
    setFontFamily,
    resetSettings,
  };
}
