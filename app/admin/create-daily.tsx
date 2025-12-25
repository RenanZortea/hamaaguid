import { db as firestoreDb } from '@/config/firebaseConfig';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputSelectionChangeEventData,
    TouchableOpacity,
    View
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface Book {
  id: number;
  name: string;
}

interface Verse {
  id: number;
  text: string;
}

type SelectionStep = 'BOOK' | 'CHAPTER' | 'VERSE';

// Hebrew numeral helper
function numberToHebrew(num: number): string {
  const gematria: {[key: number]: string} = {
    1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט', 10: 'י',
    20: 'כ', 30: 'ל', 40: 'מ', 50: 'נ', 60: 'ס', 70: 'ע', 80: 'פ', 90: 'צ', 100: 'ק',
    200: 'ר', 300: 'ש', 400: 'ת'
  };
  
  if (num <= 10) return gematria[num] || '';
  if (num < 20) {
    if (num === 15) return 'טו';
    if (num === 16) return 'טז';
    return 'י' + (gematria[num - 10] || '');
  }
  const tens = Math.floor(num / 10) * 10;
  const units = num % 10;
  if (units === 0) return gematria[tens] || '';
  return (gematria[tens] || '') + (gematria[units] || '');
}

export default function AdminCreateDailyScreen() {
  const bibleDb = useSQLiteContext();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const [date, setDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date()); // Temp date for picker (prevents rerenders)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Format date for Firebase doc ID
  const dateString = date.toISOString().split('T')[0];

  // Open date picker with current date
  const openDatePicker = () => {
    setTempDate(new Date(date));
    setShowDatePicker(true);
  };

  // Confirm date selection
  const confirmDatePicker = () => {
    setDate(new Date(tempDate));
    setShowDatePicker(false);
  };

  // Verse State
  const [verseReference, setVerseReference] = useState('');
  const [verseText, setVerseText] = useState('');

  // Study State
  const [devotionalTitle, setDevotionalTitle] = useState('');
  const [devotionalDescription, setDevotionalDescription] = useState('');
  const [devotionalContent, setDevotionalContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const contentInputRef = useRef<TextInput>(null);

  // Formatting toolbar helpers
  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const { start, end } = selection;
    const selectedText = devotionalContent.substring(start, end);
    const beforeText = devotionalContent.substring(0, start);
    const afterText = devotionalContent.substring(end);
    
    const newText = beforeText + prefix + selectedText + suffix + afterText;
    setDevotionalContent(newText);
    
    // Focus back on input
    setTimeout(() => contentInputRef.current?.focus(), 100);
  };

  const insertLinePrefix = (prefix: string) => {
    const { start } = selection;
    // Find the start of the current line
    const beforeCursor = devotionalContent.substring(0, start);
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    
    const beforeLine = devotionalContent.substring(0, lineStart);
    const afterLineStart = devotionalContent.substring(lineStart);
    
    const newText = beforeLine + prefix + afterLineStart;
    setDevotionalContent(newText);
    
    setTimeout(() => contentInputRef.current?.focus(), 100);
  };

  const handleSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    setSelection(e.nativeEvent.selection);
  };

  // Verse Selector Dialog State
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogStep, setDialogStep] = useState<SelectionStep>('BOOK');
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapterCount, setChapterCount] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingDialog, setLoadingDialog] = useState(false);

  // Load books on mount
  useEffect(() => {
    const loadBooks = async () => {
      const result = await bibleDb.getAllAsync<{מזהה: number, שם: string}>(
        'SELECT מזהה, שם FROM ספרים ORDER BY מזהה ASC'
      );
      setBooks(result.map(b => ({ id: b.מזהה, name: b.שם })));
    };
    loadBooks();
  }, [bibleDb]);

  // Load chapter count when book is selected
  const loadChapterCount = useCallback(async (bookId: number) => {
    const result = await bibleDb.getFirstAsync<{max_chapter: number}>(
      'SELECT MAX(פרק) as max_chapter FROM פסוקים WHERE מזהה_ספר = ?',
      [bookId]
    );
    setChapterCount(result?.max_chapter || 0);
  }, [bibleDb]);

  // Load verses when chapter is selected
  const loadVerses = useCallback(async (bookId: number, chapter: number) => {
    setLoadingDialog(true);
    const result = await bibleDb.getAllAsync<{פסוק: number, תוכן: string}>(
      'SELECT פסוק, תוכן FROM פסוקים WHERE מזהה_ספר = ? AND פרק = ? ORDER BY פסוק ASC',
      [bookId, chapter]
    );
    setVerses(result.map(v => ({ id: v.פסוק, text: v.תוכן })));
    setLoadingDialog(false);
  }, [bibleDb]);

  // Dialog handlers
  const openVerseDialog = () => {
    setDialogStep('BOOK');
    setDialogVisible(true);
  };

  const handleBookSelect = async (book: Book) => {
    setSelectedBook(book);
    await loadChapterCount(book.id);
    setDialogStep('CHAPTER');
  };

  const handleChapterSelect = async (chapter: number) => {
    setSelectedChapter(chapter);
    if (selectedBook) {
      await loadVerses(selectedBook.id, chapter);
    }
    setDialogStep('VERSE');
  };

  const handleVerseSelect = (verse: Verse) => {
    if (selectedBook) {
      const reference = `${selectedBook.name} ${numberToHebrew(selectedChapter)}:${numberToHebrew(verse.id)}`;
      setVerseReference(reference);
      setVerseText(verse.text);
    }
    setDialogVisible(false);
  };

  const handleDialogBack = () => {
    if (dialogStep === 'CHAPTER') setDialogStep('BOOK');
    else if (dialogStep === 'VERSE') setDialogStep('CHAPTER');
  };

  // Fetch existing data when date changes
  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const docRef = doc(firestoreDb, 'daily_content', dateString);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVerseReference(data.verseReference || '');
          setDevotionalTitle(data.devotionalTitle || '');
          setDevotionalDescription(data.devotionalDescription || '');
          setDevotionalContent(data.devotionalContent || '');
        } else {
          setVerseReference('');
          setVerseText('');
          setDevotionalTitle('');
          setDevotionalDescription('');
          setDevotionalContent('');
        }
      } catch (err) {
        console.error("Error fetching data for date:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [dateString]);

  const handleSave = async () => {
    if (!date) {
      Alert.alert('שגיאה', 'יש להזין תאריך');
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(firestoreDb, 'daily_content', dateString), {
        type: 'daily_combined',
        verseReference,
        devotionalTitle: devotionalTitle || 'לימוד יומי',
        devotionalDescription,
        devotionalContent,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      Alert.alert('הצלחה', 'התוכן עודכן בהצלחה!');
    } catch (e: any) {
      console.error(e);
      Alert.alert('שגיאה', 'שמירת התוכן נכשלה: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const tintColor = Colors[theme].tint;

  // Markdown styles
  const markdownStyles = {
    body: {
      color: theme === 'dark' ? '#e5e5e5' : '#1f2937',
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: { color: theme === 'dark' ? '#fff' : '#111', fontSize: 24, fontWeight: 'bold' as const },
    heading2: { color: theme === 'dark' ? '#fff' : '#111', fontSize: 20, fontWeight: 'bold' as const },
    strong: { fontWeight: 'bold' as const },
    blockquote: {
      backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6',
      borderLeftColor: tintColor,
      borderLeftWidth: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: Colors[theme].text }]}>ניהול תוכן יומי</Text>

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: Colors[theme].text }]}>תאריך</Text>
          <TouchableOpacity
            onPress={openDatePicker}
            style={[styles.dateButton, { borderColor: theme === 'dark' ? '#444' : '#ddd', backgroundColor: theme === 'dark' ? '#262626' : '#fff' }]}
          >
            <Ionicons name="calendar-outline" size={20} color={tintColor} />
            <Text style={[styles.dateButtonText, { color: Colors[theme].text }]}>
              {date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.datePickerModal, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
              {/* Header with close button */}
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.datePickerClose}>
                  <Ionicons name="close" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
                <Text style={[styles.datePickerTitle, { color: Colors[theme].text }]}>בחר תאריך</Text>
                <View style={{ width: 40 }} />
              </View>
              
              <View style={styles.datePickerRow}>
                {/* Day */}
                <View style={styles.datePickerCol}>
                  <Text style={[styles.datePickerLabel, { color: '#888' }]}>יום</Text>
                  <View style={styles.datePickerButtons}>
                    <TouchableOpacity 
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate() + 1))} 
                      style={[styles.datePickerArrow, { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }]}
                    >
                      <Ionicons name="chevron-up" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={[styles.datePickerValue, { color: Colors[theme].text }]}>{tempDate.getDate()}</Text>
                    <TouchableOpacity 
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate() - 1))} 
                      style={[styles.datePickerArrow, { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }]}
                    >
                      <Ionicons name="chevron-down" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Month */}
                <View style={styles.datePickerCol}>
                  <Text style={[styles.datePickerLabel, { color: '#888' }]}>חודש</Text>
                  <View style={styles.datePickerButtons}>
                    <TouchableOpacity 
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, tempDate.getDate()))} 
                      style={[styles.datePickerArrow, { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }]}
                    >
                      <Ionicons name="chevron-up" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={[styles.datePickerValue, { color: Colors[theme].text }]}>{tempDate.getMonth() + 1}</Text>
                    <TouchableOpacity 
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() - 1, tempDate.getDate()))} 
                      style={[styles.datePickerArrow, { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }]}
                    >
                      <Ionicons name="chevron-down" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Year */}
                <View style={styles.datePickerCol}>
                  <Text style={[styles.datePickerLabel, { color: '#888' }]}>שנה</Text>
                  <View style={styles.datePickerButtons}>
                    <TouchableOpacity 
                      onPress={() => setTempDate(new Date(tempDate.getFullYear() + 1, tempDate.getMonth(), tempDate.getDate()))} 
                      style={[styles.datePickerArrow, { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }]}
                    >
                      <Ionicons name="chevron-up" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={[styles.datePickerValue, { color: Colors[theme].text }]}>{tempDate.getFullYear()}</Text>
                    <TouchableOpacity 
                      onPress={() => setTempDate(new Date(tempDate.getFullYear() - 1, tempDate.getMonth(), tempDate.getDate()))} 
                      style={[styles.datePickerArrow, { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }]}
                    >
                      <Ionicons name="chevron-down" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                onPress={confirmDatePicker} 
                style={[styles.datePickerDone, { backgroundColor: '#0a7ea4' }]}
              >
                <Text style={styles.datePickerDoneText}>אישור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {fetching ? (
          <ActivityIndicator style={{ marginVertical: 40 }} size="large" color={tintColor} />
        ) : (
          <>
            {/* Verse of the Day Section */}
            <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f9fafb', borderColor: theme === 'dark' ? '#333' : '#e5e7eb' }]}>
              <Text style={[styles.sectionTitle, { color: tintColor }]}>פסוק היום</Text>

              <TouchableOpacity
                onPress={openVerseDialog}
                style={[styles.selectButton, { borderColor: theme === 'dark' ? '#444' : '#ddd' }]}
              >
                <Ionicons name="book-outline" size={20} color={tintColor} />
                <Text style={[styles.selectButtonText, { color: Colors[theme].text }]}>
                  {verseReference || 'לחץ לבחירת פסוק'}
                </Text>
              </TouchableOpacity>

              {verseText ? (
                <View style={[styles.versePreview, { backgroundColor: theme === 'dark' ? '#262626' : '#fff', borderColor: theme === 'dark' ? '#444' : '#e5e7eb' }]}>
                  <Text style={[styles.verseRefText, { color: Colors[theme].text }]}>{verseReference}</Text>
                  <Text style={[styles.verseTextPreview, { color: Colors[theme].text }]}>{verseText}</Text>
                </View>
              ) : null}

              <Text style={[styles.helperText, { color: '#888' }]}>או הזן ידנית:</Text>
              <TextInput
                value={verseReference}
                onChangeText={(text) => { setVerseReference(text); setVerseText(''); }}
                style={[styles.input, { color: Colors[theme].text, borderColor: theme === 'dark' ? '#444' : '#ddd', backgroundColor: theme === 'dark' ? '#262626' : '#fff' }]}
                placeholder="בראשית א:א"
                placeholderTextColor="#888"
                textAlign="right"
              />
            </View>

            {/* Daily Study Section */}
            <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f9fafb', borderColor: theme === 'dark' ? '#333' : '#e5e7eb' }]}>
              <Text style={[styles.sectionTitle, { color: tintColor }]}>לימוד יומי</Text>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: Colors[theme].text }]}>כותרת הלימוד</Text>
                <TextInput
                  value={devotionalTitle}
                  onChangeText={setDevotionalTitle}
                  style={[styles.input, { color: Colors[theme].text, borderColor: theme === 'dark' ? '#444' : '#ddd', backgroundColor: theme === 'dark' ? '#262626' : '#fff' }]}
                  placeholder="לימוד יומי"
                  placeholderTextColor="#888"
                  textAlign="right"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: Colors[theme].text }]}>תיאור קצר</Text>
                <TextInput
                  value={devotionalDescription}
                  onChangeText={setDevotionalDescription}
                  style={[styles.input, { color: Colors[theme].text, borderColor: theme === 'dark' ? '#444' : '#ddd', backgroundColor: theme === 'dark' ? '#262626' : '#fff' }]}
                  placeholder="תיאור קצר של הלימוד..."
                  placeholderTextColor="#888"
                  textAlign="right"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.contentHeader}>
                  <Text style={[styles.label, { color: Colors[theme].text }]}>תוכן הלימוד (Markdown)</Text>
                  <TouchableOpacity
                    onPress={() => setShowPreview(!showPreview)}
                    style={[styles.previewToggle, { backgroundColor: showPreview ? '#0a7ea4' : 'transparent', borderColor: '#0a7ea4' }]}
                  >
                    <Ionicons name={showPreview ? "eye" : "eye-outline"} size={16} color={showPreview ? '#fff' : '#0a7ea4'} />
                    <Text style={{ color: showPreview ? '#fff' : '#0a7ea4', marginLeft: 4, fontSize: 12 }}>
                      {showPreview ? 'עריכה' : 'תצוגה'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showPreview ? (
                  <View style={[styles.markdownPreview, { backgroundColor: theme === 'dark' ? '#262626' : '#fff', borderColor: theme === 'dark' ? '#444' : '#ddd' }]}>
                    {devotionalContent ? (
                      <Markdown style={markdownStyles}>{devotionalContent}</Markdown>
                    ) : (
                      <Text style={{ color: '#888', fontStyle: 'italic' }}>אין תוכן להציג</Text>
                    )}
                  </View>
                ) : (
                  <View>
                    {/* Formatting Toolbar */}
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={[styles.toolbar, { backgroundColor: theme === 'dark' ? '#333' : '#f3f4f6', borderColor: theme === 'dark' ? '#444' : '#ddd' }]}
                      contentContainerStyle={{ gap: 4, paddingHorizontal: 8 }}
                    >
                      <TouchableOpacity onPress={() => insertFormatting('**')} style={styles.toolbarBtn}>
                        <Text style={[styles.toolbarBtnText, { color: Colors[theme].text, fontWeight: 'bold' }]}>B</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => insertFormatting('*')} style={styles.toolbarBtn}>
                        <Text style={[styles.toolbarBtnText, { color: Colors[theme].text, fontStyle: 'italic' }]}>I</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => insertLinePrefix('# ')} style={styles.toolbarBtn}>
                        <Text style={[styles.toolbarBtnText, { color: Colors[theme].text }]}>H1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => insertLinePrefix('## ')} style={styles.toolbarBtn}>
                        <Text style={[styles.toolbarBtnText, { color: Colors[theme].text }]}>H2</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => insertLinePrefix('### ')} style={styles.toolbarBtn}>
                        <Text style={[styles.toolbarBtnText, { color: Colors[theme].text }]}>H3</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => insertLinePrefix('> ')} style={styles.toolbarBtn}>
                        <Ionicons name="chatbox-outline" size={18} color={Colors[theme].text} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => insertLinePrefix('- ')} style={styles.toolbarBtn}>
                        <Ionicons name="list" size={18} color={Colors[theme].text} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => insertLinePrefix('1. ')} style={styles.toolbarBtn}>
                        <Text style={[styles.toolbarBtnText, { color: Colors[theme].text }]}>1.</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => insertFormatting('[', '](url)')} style={styles.toolbarBtn}>
                        <Ionicons name="link" size={18} color={Colors[theme].text} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => insertFormatting('---\n', '')} style={styles.toolbarBtn}>
                        <Text style={[styles.toolbarBtnText, { color: Colors[theme].text }]}>—</Text>
                      </TouchableOpacity>
                    </ScrollView>

                    {/* Editor */}
                    <TextInput
                      ref={contentInputRef}
                      value={devotionalContent}
                      onChangeText={setDevotionalContent}
                      onSelectionChange={handleSelectionChange}
                      selection={selection}
                      style={[styles.input, styles.multiline, styles.editorWithToolbar, { color: Colors[theme].text, borderColor: theme === 'dark' ? '#444' : '#ddd', backgroundColor: theme === 'dark' ? '#262626' : '#fff' }]}
                      multiline
                      placeholder="# כותרת&#10;&#10;טקסט רגיל עם **הדגשה** ו*הטיה*&#10;&#10;> ציטוט"
                      placeholderTextColor="#888"
                      textAlign="right"
                      textAlignVertical="top"
                    />
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#0a7ea4' }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>שמור שינויים</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Verse Selection Modal */}
      <Modal visible={dialogVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme === 'dark' ? '#333' : '#e5e7eb' }]}>
              <TouchableOpacity onPress={() => setDialogVisible(false)} style={styles.modalHeaderBtn}>
                <Ionicons name="close" size={24} color={Colors[theme].text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: Colors[theme].text }]}>בחירת פסוק</Text>
              {dialogStep !== 'BOOK' ? (
                <TouchableOpacity onPress={handleDialogBack} style={styles.modalHeaderBtn}>
                  <Ionicons name="arrow-forward" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 40 }} />
              )}
            </View>

            {/* Breadcrumb */}
            <View style={[styles.breadcrumb, { backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6' }]}>
              <Text style={{ color: '#888', textAlign: 'right' }}>
                {dialogStep === 'BOOK' && 'בחר ספר'}
                {dialogStep === 'CHAPTER' && `${selectedBook?.name} › בחר פרק`}
                {dialogStep === 'VERSE' && `${selectedBook?.name} ${numberToHebrew(selectedChapter)} › בחר פסוק`}
              </Text>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody}>
              {loadingDialog ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={tintColor} />
              ) : (
                <>
                  {dialogStep === 'BOOK' && (
                    <View style={styles.grid}>
                      {books.map((book) => (
                        <TouchableOpacity
                          key={book.id}
                          onPress={() => handleBookSelect(book)}
                          style={[styles.gridItem, { backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6' }]}
                        >
                          <Text style={{ color: Colors[theme].text, textAlign: 'center' }}>{book.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {dialogStep === 'CHAPTER' && (
                    <View style={styles.grid}>
                      {Array.from({ length: chapterCount }, (_, i) => i + 1).map((num) => (
                        <TouchableOpacity
                          key={num}
                          onPress={() => handleChapterSelect(num)}
                          style={[styles.chapterItem, { backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6' }]}
                        >
                          <Text style={{ color: Colors[theme].text, textAlign: 'center', fontSize: 16 }}>{numberToHebrew(num)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {dialogStep === 'VERSE' && (
                    <View style={styles.verseList}>
                      {verses.map((verse) => (
                        <TouchableOpacity
                          key={verse.id}
                          onPress={() => handleVerseSelect(verse)}
                          style={[styles.verseItem, { backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6' }]}
                        >
                          <Text style={[styles.verseNumber, { color: tintColor }]}>{numberToHebrew(verse.id)}</Text>
                          <Text style={[styles.verseItemText, { color: Colors[theme].text }]} numberOfLines={2}>{verse.text}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  section: { marginBottom: 20 },
  card: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'right' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, textAlign: 'right' },
  helperText: { fontSize: 12, marginTop: 12, marginBottom: 4, textAlign: 'right' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  multiline: { minHeight: 200, textAlignVertical: 'top' },
  selectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed' },
  selectButtonText: { fontSize: 16, fontWeight: '500' },
  versePreview: { padding: 16, borderRadius: 12, marginTop: 12, borderWidth: 1 },
  verseRefText: { fontSize: 14, fontWeight: '600', marginBottom: 8, textAlign: 'right' },
  verseTextPreview: { fontSize: 18, lineHeight: 28, textAlign: 'right' },
  contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  previewToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  markdownPreview: { borderWidth: 1, borderRadius: 12, padding: 16, minHeight: 200 },
  saveButton: { paddingVertical: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalHeaderBtn: { padding: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  breadcrumb: { paddingHorizontal: 16, paddingVertical: 10 },
  modalBody: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, minWidth: '30%' },
  chapterItem: { width: 50, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  verseList: { gap: 8 },
  verseItem: { flexDirection: 'row', padding: 12, borderRadius: 10, gap: 12 },
  verseNumber: { fontSize: 14, fontWeight: 'bold', minWidth: 30, textAlign: 'center' },
  verseItemText: { flex: 1, fontSize: 14, lineHeight: 22, textAlign: 'right' },
  // Toolbar styles
  toolbar: { borderWidth: 1, borderRadius: 12, paddingVertical: 8, marginBottom: 8, flexDirection: 'row' },
  toolbarBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  toolbarBtnText: { fontSize: 16 },
  editorWithToolbar: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  // Date picker styles
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  dateButtonText: { fontSize: 16, fontWeight: '500' },
  datePickerModal: { borderRadius: 20, padding: 24, margin: 20, alignItems: 'center' },
  datePickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  datePickerClose: { padding: 8 },
  datePickerTitle: { fontSize: 18, fontWeight: 'bold' },
  datePickerRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  datePickerCol: { alignItems: 'center' },
  datePickerLabel: { fontSize: 12, marginBottom: 8 },
  datePickerButtons: { alignItems: 'center' },
  datePickerArrow: { padding: 12, borderRadius: 10 },
  datePickerValue: { fontSize: 28, fontWeight: 'bold', marginVertical: 4 },
  datePickerDone: { paddingHorizontal: 40, paddingVertical: 12, borderRadius: 10 },
  datePickerDoneText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
