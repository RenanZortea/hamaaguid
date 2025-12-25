import { db } from '@/config/firebaseConfig';
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    QueryDocumentSnapshot,
    startAfter
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

export interface DailyStudy {
  id: string; // Document ID is the date (YYYY-MM-DD)
  devotionalTitle?: string;
  devotionalDescription?: string;
  devotionalContent?: string;
  verseReference?: string;
  // Add other fields as necessary
}

const SAMPLE_STUDIES: DailyStudy[] = [
  {
    id: 'sample-1',
    devotionalTitle: 'למה ללמוד תורה?',
    devotionalDescription: 'לימוד התורה מחזק את הקשר שלנו עם הקב״ה ומעשיר את חיינו בחכמה ובהבנה. התורה היא ספר ההוראות של העולם, וככל שנלמד אותה יותר, כך נדע טוב יותר כיצד לחיות את חיינו בצורה נכונה וטובה.',
    devotionalContent: '# למה ללמוד תורה?\n\nלימוד התורה הוא לא רק צבירת ידע, אלא חיבור למקור החיים. דרך הלימוד אנחנו מתקשרים לבורא עולם ומבינים את רצונו.\n\n"כי הם חיינו ואורך ימינו"',
  },
  {
    id: 'sample-2',
    devotionalTitle: 'כוחה של תפילה',
    devotionalDescription: 'התפילה היא הכלי בו אנו משתמשים כדי לדבר עם בורא עולם. היא מאפשרת לנו להביע את רגשותינו, לבקש בקשות ולהודות על כל הטוב שיש לנו.',
    devotionalContent: '# כוחה של תפילה\n\nהתפילה פותחת שערים בשמיים. גם תפילה קצרה מעומק הלב יכולה לשנות עולמות.',
  },
  {
    id: 'sample-3',
    devotionalTitle: 'אהבת חינם',
    devotionalDescription: 'ואהבת לרעך כמוך - זהו כלל גדול בתורה. אהבת חינם היא המפתח לגאולה ולתיקון העולם.',
    devotionalContent: '# אהבת חינם\n\nכשם שבית המקדש נחרב על שנאת חינם, כך הוא ייבנה על אהבת חינם. כל מעשה קטן של חסד מקרב אותנו לגאולה.',
  }
];

export function useDailyStudies(pageSize = 10) {
  const [data, setData] = useState<DailyStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Order by document ID (which is date) descending to get newest first
      // Note: key-based pagination (ordering by __name__) is efficient in Firestore
      const q = query(
        collection(db, 'daily_content'),
        orderBy('__name__', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      
      const newData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DailyStudy));

      setData(newData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
    } catch (err) {
      console.error("Error fetching daily studies, using sample data:", err);
      // Fallback to sample data on error
      setData(SAMPLE_STUDIES);
      setHasMore(false); // No more data to load in offline mode
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'daily_content'),
        orderBy('__name__', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      
      const newData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DailyStudy));

      setData(prev => [...prev, ...newData]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
    } catch (err) {
      console.error("Error fetching more daily studies:", err);
      setError(err as Error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, pageSize]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const refresh = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    data,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    fetchMore
  };
}
