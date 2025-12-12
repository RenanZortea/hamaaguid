import { SQLiteDatabase } from 'expo-sqlite';
import { parseHebrewNumeral } from './hebrewNumerals';

export interface FetchedVerse {
  text: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
}

export async function fetchVerseFromReference(db: SQLiteDatabase, reference: string): Promise<FetchedVerse | null> {
  if (!reference) return null;

  try {
    // 1. Get all books to parse the reference
    // Fetching all books every time might be slightly inefficient but usually fast enough for a single call per app load.
    // If optimization is needed, we can cache this or pass it in.
    const books = await db.getAllAsync<{מזהה: number, שם: string}>('SELECT * FROM ספרים ORDER BY מזהה ASC');
    const sortedBooks = books.map(b => b.שם).sort((a, b) => b.length - a.length);

    const cleanRef = reference.trim();
    
    // 2. Find Book
    let bookName = '';
    let remainder = '';
    
    for (const book of sortedBooks) {
      if (cleanRef.startsWith(book)) {
        bookName = book;
        remainder = cleanRef.slice(book.length).trim();
        break;
      }
    }
    
    if (!bookName) return null; // Invalid reference

    // 3. Parse Chapter/Verse
    // Matches: "Chapter:Verse" or "Chapter Verse" or "Chapter:Verse-Verse"
    // Regex explanation:
    // ^([א-ת"']+) : Chapter (Hebrew letters/quotes)
    // (?:[\s:]+ : Separator (space or colon)
    // ([א-ת"']+) : Start Verse
    // (?:[\s\-]+([א-ת"']+))?)$ : Optional End Verse
    const parts = remainder.match(/^([א-ת"']+)(?:[\s:]+([א-ת"']+)(?:[\s\-]+([א-ת"']+))?)?$/);
    
    if (!parts) return null;

    const chapterNum = parseHebrewNumeral(parts[1]);
    const verseStartNum = parts[2] ? parseHebrewNumeral(parts[2]) : 1;
    const verseEndNum = parts[3] ? parseHebrewNumeral(parts[3]) : null;

    if (chapterNum <= 0) return null;

    // 4. Query DB
    // Handle single verse or range
    let rows: {תוכן: string}[];
    if (verseEndNum) {
        rows = await db.getAllAsync<{תוכן: string}>(
            `SELECT p.תוכן FROM פסוקים p 
             JOIN ספרים s ON p.מזהה_ספר = s.מזהה 
             WHERE s.שם = ? AND p.פרק = ? AND p.פסוק >= ? AND p.פסוק <= ?
             ORDER BY p.פסוק ASC`,
            [bookName, chapterNum, verseStartNum, verseEndNum]
        );
    } else {
        rows = await db.getAllAsync<{תוכן: string}>(
            `SELECT p.תוכן FROM פסוקים p 
             JOIN ספרים s ON p.מזהה_ספר = s.מזהה 
             WHERE s.שם = ? AND p.פרק = ? AND p.פסוק = ?`,
            [bookName, chapterNum, verseStartNum]
        );
    }
    
    if (!rows || rows.length === 0) return null;

    const text = rows.map(r => r.תוכן).join(' '); // Join multiple verses with space if range

    return {
        text,
        reference,
        book: bookName,
        chapter: chapterNum,
        verse: verseStartNum
    };

  } catch (error) {
    console.error("Error fetching verse from reference:", error);
    return null;
  }
}
