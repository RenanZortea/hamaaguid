import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChevronLeft, Clock, Heart, LucideIcon, Users, LogOut, LogIn } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Firebase & Google Imports
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../../config/firebaseConfig.ts';
import { onAuthStateChanged, signOut, signInWithCredential, GoogleAuthProvider, User } from 'firebase/auth';

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  color?: string; // Allow custom color for logout/login
}

function MenuItem({ icon: Icon, label, onPress, color }: MenuItemProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = color || Colors[theme].tint;
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <ThemedView style={styles.menuItem}>
        {/* Left-pointing chevron for "forward" navigation in RTL */}
        <ChevronLeft size={20} color={Colors[theme].icon || '#888'} />
        
        <ThemedView style={styles.menuLabelContainer}>
          <ThemedText type="defaultSemiBold" style={{ textAlign: 'right', color: color }}>{label}</ThemedText>
        </ThemedView>
        
        <Icon size={24} color={iconColor} style={styles.menuIcon} />
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Initialize Google Sign-In and Auth Listener
  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      // Get this from Google Cloud Console > Credentials > OAuth 2.0 Client IDs > Web client
      webClientId: 'YOUR_WEB_CLIENT_ID_GOES_HERE', 
    });

    // Listen for user state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 2. Handle Google Login
  const onGoogleButtonPress = async () => {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the user's ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      await signInWithCredential(auth, googleCredential);
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
        console.error(error);
        Alert.alert('שגיאה בהתחברות', error.message);
      }
    }
  };

  // 3. Handle Logout
  const handleSignOut = async () => {
    try {
      await GoogleSignin.signOut();
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header Section */}
          <View style={styles.header}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' }]}>
               <ThemedText style={{ fontSize: 32 }}>
                 {user?.photoURL ? (
                    // In a real app, use <Image> here with user.photoURL
                    // For now, we just use the first letter of their name
                    user.displayName?.charAt(0).toUpperCase()
                 ) : 'א'}
               </ThemedText>
            </View>
            <ThemedText type="title" style={styles.username}>
              {user ? user.displayName : 'אורח'}
            </ThemedText>
            <ThemedText style={styles.handle}>
              {user ? user.email : 'התחבר כדי לשמור את ההתקדמות שלך'}
            </ThemedText>
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
              
              <View style={[styles.separator, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' }]} />
              
              {/* Dynamic Login/Logout Button */}
              {user ? (
                <MenuItem 
                  icon={LogOut} 
                  label="התנתק" 
                  onPress={handleSignOut} 
                  color="#FF3B30" // Red color for logout
                />
              ) : (
                <MenuItem 
                  icon={LogIn} 
                  label="התחבר עם Google" 
                  onPress={onGoogleButtonPress} 
                  color="#007AFF" // Blue color for login
                />
              )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between', 
    backgroundColor: 'transparent',
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
