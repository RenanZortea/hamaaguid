import { db } from '@/config/firebaseConfig';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminCreateDailyScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  
  const [activeTab, setActiveTab] = useState<'verse' | 'study'>('verse');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Verse State
  const [verseReference, setVerseReference] = useState('');

  // Study State
  const [devotionalTitle, setDevotionalTitle] = useState('');
  const [devotionalContent, setDevotionalContent] = useState('');

  // Fetch existing data when date changes
  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const docRef = doc(db, 'daily_content', date);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVerseReference(data.verseReference || '');
          setDevotionalTitle(data.devotionalTitle || '');
          setDevotionalContent(data.devotionalContent || '');
        } else {
          // Reset fields if new date
          setVerseReference('');
          setDevotionalTitle('');
          setDevotionalContent('');
        }
      } catch (err) {
        console.error("Error fetching data for date:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [date]);

  const handleSave = async () => {
    if (!date) {
      Alert.alert('שגיאה', 'יש להזין תאריך');
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, 'daily_content', date), {
        type: 'daily_combined',
        verseReference,
        devotionalTitle: devotionalTitle || 'לימוד יומי',
        devotionalContent,
        updatedAt: new Date().toISOString(),
      }, { merge: true }); // Merge to avoid overwriting unrelated fields if any
      Alert.alert('הצלחה', 'התוכן עודכן בהצלחה!');
    } catch (e: any) {
      console.error(e);
      Alert.alert('שגיאה', 'שמירת התוכן נכשלה: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = () => ({
    ...styles.input,
    color: Colors[theme].text,
    borderColor: Colors[theme].icon || '#ccc',
    backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: Colors[theme].text }]}>ניהול תוכן יומי</Text>

        {/* Date Picker Section */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: Colors[theme].text }]}>תאריך (YYYY-MM-DD)</Text>
          <TextInput 
            value={date} 
            onChangeText={setDate} 
            style={getInputStyle()} 
            placeholder="2023-10-27"
            placeholderTextColor="#888"
            textAlign="left"
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'study' && styles.activeTab, { borderColor: Colors[theme].tint }]} 
            onPress={() => setActiveTab('study')}
          >
            <Text style={[
                styles.tabText, 
                { color: activeTab === 'study' ? '#fff' : Colors[theme].text }
              ]}>
              לימוד יומי
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'verse' && styles.activeTab, { borderColor: Colors[theme].tint }]} 
            onPress={() => setActiveTab('verse')}
          >
            <Text style={[
                styles.tabText, 
                { color: activeTab === 'verse' ? '#fff' : Colors[theme].text }
              ]}>
              פסוק היום
            </Text>
          </TouchableOpacity>
        </View>
        
        {fetching ? (
             <ActivityIndicator style={{ marginVertical: 20 }} />
        ) : (
            <View>
                {activeTab === 'verse' ? (
                    <View>
                        <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: Colors[theme].text }]}>מקור (לדוגמה: בראשית א:א)</Text>
                        <TextInput 
                            value={verseReference} 
                            onChangeText={setVerseReference} 
                            style={getInputStyle()} 
                            placeholder="בראשית א:א"
                            placeholderTextColor="#888"
                            textAlign="right"
                        />
                        </View>
                    </View>
                ) : (
                    <View>
                        <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: Colors[theme].text }]}>כותרת הלימוד (אופציונלי)</Text>
                        <TextInput 
                            value={devotionalTitle} 
                            onChangeText={setDevotionalTitle} 
                            style={getInputStyle()} 
                            placeholder="לימוד יומי"
                            placeholderTextColor="#888"
                            textAlign="right"
                        />
                        </View>

                        <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: Colors[theme].text }]}>תוכן הלימוד</Text>
                        <TextInput 
                            value={devotionalContent} 
                            onChangeText={setDevotionalContent} 
                            style={[getInputStyle(), styles.multiline]} 
                            multiline 
                            placeholder="הכנס את טקסט הלימוד כאן..."
                            placeholderTextColor="#888"
                            textAlign="right"
                        />
                        </View>
                    </View>
                )}
            </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={Colors[theme].tint} />
        ) : (
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: Colors[theme].tint }]} 
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>שמור שינויים</Text>
          </TouchableOpacity>
          // <Button title="שמור שינויים" onPress={handleSave} color={Colors[theme].tint} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'right', // Align labels to right
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multiline: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
    justifyContent: 'center',
    direction: 'rtl', // Ensure tabs flow naturally for RTL? Or just manual order
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeTab: {
    backgroundColor: '#0a7ea4', // Adjust to match your theme tint if possible
    borderColor: '#0a7ea4',
  },
  tabText: {
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
