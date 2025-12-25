import { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { useUserDb } from './useUserDb';

export interface ReadingProgress {
  bookId: number;
  chapter: number;
  lastReadDate: string | null;
  bookName?: string;
  isCompleted?: boolean;
}

const PLAN_ID = 'sequential_tanakh';

export const useReadingPlan = (bibleDb: SQLiteDatabase) => {
  const userDb = useUserDb();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Get current progress from user DB
      const result = await userDb.getFirstAsync<{book_id: number, chapter: number, last_read_date: string, is_completed: number}>(
        'SELECT * FROM reading_progress WHERE plan_id = ?', 
        [PLAN_ID]
      );

      let currentBookId = 1;
      let currentChapter = 1;
      let lastReadDate = null;
      let isCompleted = false;

      if (result) {
        currentBookId = result.book_id;
        currentChapter = result.chapter;
        lastReadDate = result.last_read_date;
        // Check if we need to advance (Lazy Advancement)
        // If it WAS completed, AND the date it was read is NOT today (meaning it's a new day), we advance.
        if (result.is_completed && result.last_read_date !== today) {
           // Calculate Next
           const maxChapterRes = await bibleDb.getFirstAsync<{max_chapter: number}>(
             'SELECT MAX(פרק) as max_chapter FROM פסוקים WHERE מזהה_ספר = ?',
             [currentBookId]
           );
           const maxChapter = maxChapterRes?.max_chapter || 50; 
           
           let nextBookId = currentBookId;
           let nextChapter = currentChapter + 1;

           if (nextChapter > maxChapter) {
             nextBookId = currentBookId + 1;
             nextChapter = 1;
           }
           
           // Update DB with NEW target
           await userDb.runAsync(
             `UPDATE reading_progress SET book_id = ?, chapter = ?, is_completed = 0, last_read_date = ? WHERE plan_id = ?`,
             [nextBookId, nextChapter, result.last_read_date, PLAN_ID] 
           );
           
           currentBookId = nextBookId;
           currentChapter = nextChapter;
           isCompleted = false;
        } else {
           isCompleted = !!result.is_completed;
        }
      }

      // 2. Get Book Name
      const bookRes = await bibleDb.getFirstAsync<{שם: string}>(
        'SELECT שם FROM ספרים WHERE מזהה = ?',
        [currentBookId]
      );
      
      setProgress({
        bookId: currentBookId,
        chapter: currentChapter,
        lastReadDate: lastReadDate,
        isCompleted: isCompleted,
        bookName: bookRes?.שם || 'בראשית'
      });

    } catch (e) {
      console.error('Error fetching reading plan:', e);
    } finally {
      setLoading(false);
    }
  }, [userDb, bibleDb]);

  const markChapterComplete = async () => {
    if (!progress) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Just mark CURRENT as complete for today. Do NOT advance yet.
      await userDb.runAsync(
        `INSERT OR REPLACE INTO reading_progress (plan_id, book_id, chapter, last_read_date, is_completed)
         VALUES (?, ?, ?, ?, ?)`,
        [PLAN_ID, progress.bookId, progress.chapter, today, 1]
      );
      
      // Refresh to update UI state
      await fetchProgress();

    } catch (e) {
      console.error('Error marking chapter complete:', e);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    refresh: fetchProgress,
    markComplete: markChapterComplete
  };
};
