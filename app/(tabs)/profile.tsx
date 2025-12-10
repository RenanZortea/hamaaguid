import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChevronLeft, Clock, Heart, LucideIcon, Users } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
}

function MenuItem({ icon: Icon, label, onPress }: MenuItemProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <ThemedView style={styles.menuItem}>
        {/* Left-pointing chevron for "forward" navigation in RTL */}
        <ChevronLeft size={20} color={Colors[theme].icon || '#888'} />
        
        <ThemedView style={styles.menuLabelContainer}>
          <ThemedText type="defaultSemiBold" style={{ textAlign: 'right' }}>{label}</ThemedText>
        </ThemedView>
        
        <Icon size={24} color={Colors[theme].tint} style={styles.menuIcon} />
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header Section */}
          <View style={styles.header}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' }]}>
               <ThemedText style={{ fontSize: 32 }}>א</ThemedText>
            </View>
            <ThemedText type="title" style={styles.username}>שם משתמש</ThemedText>
            <ThemedText style={styles.handle}>@username</ThemedText>
          </View>

          {/* Menu Section */}
          <View style={styles.menuSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>תפריט</ThemedText>
            
            <View style={[styles.menuList, { backgroundColor: colorScheme === 'dark' ? '#171717' : '#f5f5f5' }]}>
              <MenuItem icon={Heart} label="מועדפים" onPress={() => {}} />
              <View style={[styles.separator, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' }]} />
              <MenuItem icon={Users} label="חברים" onPress={() => {}} />
              <View style={[styles.separator, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' }]} />
              <MenuItem icon={Clock} label="אחרונים" onPress={() => {}} />
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  handle: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 4,
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    textAlign: 'right',
    marginBottom: 12,
    marginRight: 4,
  },
  menuList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', // We will let the elements order themselves, but we want RTL specifically.
    // If the system is LTR, we manually order: [Chevron, Text, Icon] and justify 'space-between'
    // Actually, 'space-between' with [Chevron, View, Icon] will put Chevron Left, Icon Right.
    // That gives us the RTL look manually: Left side (Chevron), Right side (Icon).
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between', 
    backgroundColor: 'transparent', // Inherit from list container
  },
  menuLabelContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  menuIcon: {
    marginLeft: 0,
  },
  separator: {
    height: 1,
    width: '100%',
  },
});
