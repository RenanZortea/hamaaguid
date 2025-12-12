
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { Bell, ChevronLeft, Info, Monitor, Shield, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

interface SettingItemProps {
  icon: any;
  label: string;
  value?: boolean | string;
  type?: 'switch' | 'link' | 'info';
  onPress?: () => void;
  onValueChange?: (val: boolean) => void;
}

function SettingItem({ icon: Icon, label, value, type = 'link', onPress, onValueChange }: SettingItemProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = Colors[theme].tint;
  const textColor = Colors[theme].text;

  return (
    <View style={[styles.settingItem, { borderBottomColor: Colors[theme].background }]}>
      <View style={styles.settingLeft}>
        <Icon size={22} color={iconColor} style={styles.icon} />
        <ThemedText style={styles.label}>{label}</ThemedText>
      </View>
      
      <View style={styles.settingRight}>
        {type === 'switch' && (
          <Switch 
            value={value as boolean} 
            onValueChange={onValueChange} 
            trackColor={{ false: '#767577', true: Colors[theme].tint }}
            thumbColor={'#f4f3f4'}
          />
        )}
        
        {type === 'info' && (
           <ThemedText style={[styles.valueText, { color: Colors[theme].icon }]}>{value}</ThemedText>
        )}

        {type === 'link' && (
           <ChevronLeft size={20} color={Colors[theme].icon || '#888'} />
        )}
      </View>
    </View>
  );
}

function SettingsSection({ title, children }: { title: string, children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].tint }]}>
        {title}
      </ThemedText>
      <View style={[styles.sectionContent, { backgroundColor: colorScheme === 'dark' ? '#171717' : '#f5f5f5' }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'הגדרות' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <SettingsSection title="כללי">
          <SettingItem 
            icon={Bell} 
            label="התראות" 
            type="switch" 
            value={notifications}
            onValueChange={setNotifications} 
          />
          <SettingItem 
            icon={Monitor} 
            label="מצב כהה" 
            type="switch" 
            value={darkMode}
            onValueChange={setDarkMode} 
          />
        </SettingsSection>

        <SettingsSection title="חשבון">
          <SettingItem icon={User} label="פרופיל" type="link" onPress={() => {}} />
          <SettingItem icon={Shield} label="פרטיות ואבטחה" type="link" onPress={() => {}} />
        </SettingsSection>

        <SettingsSection title="אודות">
          <SettingItem icon={Info} label="גירסה" type="info" value="1.0.0" />
        </SettingsSection>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginHorizontal: 4,
    opacity: 0.8,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    // Separator line logic could be added here or via a separate component
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    // Add margin if needed
  },
  label: {
    fontSize: 16,
  },
  valueText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
