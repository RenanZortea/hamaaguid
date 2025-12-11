import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChevronLeft, Clock, Heart, LogIn, LogOut, LucideIcon, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Firebase & Google Imports
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut, User } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig.ts';

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
        {/* ORDER MATTERS FOR RTL:
           1. First Child = Start (Right in Hebrew)
           2. Middle Child = Middle
           3. Last Child  = End (Left in Hebrew)
        */}

        {/* 1. Icon goes FIRST (Visual Right in RTL) */}
        <Icon size={24} color={iconColor} style={styles.menuIcon} />
        
        {/* 2. Text in Middle */}
        <ThemedView style={styles.menuLabelContainer}>
          {/* REMOVE textAlign: 'right' - Default is 'left' which flips to Right in RTL */}
          <ThemedText type="defaultSemiBold" style={color ? { color } : undefined}>
            {label}
          </ThemedText>
        </ThemedView>
        
        {/* 3. Chevron goes LAST (Visual Left in RTL) */}
        {/* We keep ChevronLeft because "Forward" in Hebrew points to the Left (<) */}
        <ChevronLeft size={20} color={Colors[theme].icon || '#888'} />
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
              
              {/* Dynamic Logout Button (Inside Menu) */}
              {user && (
                <>
                  <View style={[styles.separator, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' }]} />
                  <MenuItem 
                    icon={LogOut} 
                    label="התנתק" 
                    onPress={handleSignOut} 
                    color="#FF3B30" // Red color for logout
                  />
                </>
              )}
            </View>

            {/* Premium Login Button (Outside Menu) */}
            {!user && (
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={onGoogleButtonPress}
                activeOpacity={0.8}
              >
                {/* Icon color changed to dark because button is white */}
                <LogIn size={20} color="#333" /> 
                <ThemedText style={styles.loginButtonText}>
                  התחבר עם Google
                </ThemedText>
              </TouchableOpacity>
            )}
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
    // REMOVED: textAlign: 'right' (System handles this)
    // REMOVED: marginRight: 4 (Use marginLeft in LTR code if you want indentation)
    marginBottom: 12,
  },
  menuList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', // Standard Row
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
    // alignSelf: 'flex-start', // Ensure text block aligns to start
  },
  menuIcon: {
    // No specific margins needed if using standard flex logic, 
    // but you can add marginRight (which flips to Left) to separate from text if needed.
  },
  separator: {
    height: 1,
    width: '100%',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // White background
    paddingVertical: 12,        // Smaller padding (was 16)
    borderRadius: 12,           // Slightly smaller radius (optional, kept proportional)
    marginTop: 24,
    shadowColor: '#000',        // Standard shadow for white button
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,                     // Smaller gap (was 12)
    borderWidth: 1,             
    borderColor: '#E0E0E0',     // Subtle border for contrast on white backgrounds
  },
  loginButtonText: {
    color: '#333333',           // Dark text
    fontSize: 16,               // Smaller font (was 18)
    fontWeight: '600',
    fontFamily: 'Rubik',
  },
});
