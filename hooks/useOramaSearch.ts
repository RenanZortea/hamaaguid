import { parseHebrewNumeral, toHebrewNumeral } from '@/utils/hebrewNumerals';
import { create, insertMultiple, search } from '@orama/orama';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';

const BIBLE_SCHEMA = {
  id: 'string',
  book: 'string',
  chapter: 'string', 
  verse: 'string',   
  text: 'string',
  cleanText: 'string',
} as const;

export interface SearchResult {
  type: 'book' | 'verse';
  id: string | number;
  label: string;
  subLabel?: string;
  data?: any;
}

function removeNikkud(text: string): string {
  return text ? text.replace(/[\u0591-\u05C7]/g, "") : "";
}

function parseLocation(input: string) {
  if (!input || !input.trim()) return null;
  const cleanInput = input.trim();
  const match = cleanInput.match(/^([א-ת"']+)(?:[\s:]+([א-ת"']+)(?:[\s\-]+([א-ת"']+))?)?$/);

  if (!match) return null;

  return {
    chapterStr: match[1],
    verseStartStr: match[2],
    verseEndStr: match[3]
  };
}

export function useOramaSearch(query: string) {
  const db = useSQLiteContext();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
   
  const oramaDb = useRef<any>(null);
  const allBooksRef = useRef<string[]>([]);

  // 1. Initialize Orama
  useEffect(() => {
    async function init() {
      if (oramaDb.current) return;
      try {
        const bookRows = await db.getAllAsync<{שם: string}>('SELECT שם FROM ספרים ORDER BY מזהה ASC');
        allBooksRef.current = bookRows.map(b => b.שם);

        oramaDb.current = await create({ schema: BIBLE_SCHEMA });

        const allVerses = await db.getAllAsync(`
          SELECT 
            p.מזהה as id, 
            s.שם as book, 
            p.פרק as chapter, 
            p.פסוק as verse, 
            p.תוכן as text
          FROM פסוקים p 
          JOIN ספרים s ON p.מזהה_ספר = s.מזהה
        `);

        const formattedVerses = allVerses.map(v => {
            const textVal = v.text || '';
            return {
                id: String(v.id || ''), 
                book: v.book || '',
                chapter: String(v.chapter || '0'),
                verse: String(v.verse || '0'),
                text: textVal,
                cleanText: removeNikkud(textVal),
            };
        });

        await insertMultiple(oramaDb.current, formattedVerses);
        setIsReady(true);
      } catch (e) {
        console.error('Orama init failed:', e);
      }
    }
    init();
  }, [db]);

  // 2. Run Search
  useEffect(() => {
    async function runSearch() {
      if (!isReady || !oramaDb.current || !query || query.length < 1) {
        setResults([]);
        return;
      }

      setLoading(true);
      const cleanQuery = removeNikkud(query.trim());
      
      try {
        const navResults: SearchResult[] = [];
        
        // BRANCH 2 & 3: Check Book Names and Locations
        const sortedBooks = [...allBooksRef.current].sort((a, b) => b.length - a.length);
        
        for (const book of sortedBooks) {
          // Check if the query *starts* with this book name
          if (cleanQuery.startsWith(book)) {
            const remainder = cleanQuery.slice(book.length).trim();
            
            // --- BRANCH 2: Exact Book Name Match ---
            // If the query is just the book name (e.g. "יוחנן ג"), offer to open the book.
            if (remainder === '') {
                navResults.push({
                    type: 'verse', // Using 'verse' type to keep UI consistent, or add 'book' type support
                    id: `nav-book-${book}`,
                    label: book,
                    subLabel: 'פתח את הספר',
                    data: {
                        book_name: book,
                        chapter: 1, // Default to chapter 1
                        verse: 1,
                        text: ''
                    }
                });
            }

            // --- BRANCH 3: Book + Chapter Match ---
            // If there is a remainder, try to parse it as a location (e.g. " ג" -> 3)
            const parsed = parseLocation(remainder);

            if (parsed) {
              const chapNum = parseHebrewNumeral(parsed.chapterStr);
              const verseStartNum = parsed.verseStartStr ? parseHebrewNumeral(parsed.verseStartStr) : 0;
              const verseEndNum = parsed.verseEndStr ? parseHebrewNumeral(parsed.verseEndStr) : 0;

              if (chapNum > 0) {
                // Fetch the specific verse or first verse of chapter to get ID
                let sql = '';
                let params: any[] = [];
                
                if (verseStartNum > 0) {
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? AND p.פסוק = ? LIMIT 1`;
                   params = [book, chapNum, verseStartNum];
                } else {
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? LIMIT 1`;
                   params = [book, chapNum];
                }

                if (sql) {
                  const row = await db.getFirstAsync<{מזהה: number, תוכן: string}>(sql, params);

                  if (row) {
                    const navId = `nav-${book}-${chapNum}-${verseStartNum || 1}-${verseEndNum || 'end'}`;
                    
                    let label = `${book} ${toHebrewNumeral(chapNum)}`;
                    if (verseStartNum > 0) {
                        label += `:${toHebrewNumeral(verseStartNum)}`;
                        if (verseEndNum > 0) {
                            label += `-${toHebrewNumeral(verseEndNum)}`;
                        }
                    }

                    navResults.push({
                      type: 'verse',
                      id: navId,
                      label: label,
                      subLabel: verseStartNum > 0 ? row.תוכן : 'נווט לפרק', 
                      data: {
                        id: verseStartNum > 0 ? row.מזהה : -1,
                        book_name: book,
                        chapter: chapNum,
                        verse: verseStartNum > 0 ? verseStartNum : 1,
                        endVerse: verseEndNum > 0 ? verseEndNum : null, 
                        text: row.תוכן
                      }
                    });
                  }
                }
              }
            }
            // Continue loop to find other overlapping matches (e.g. "3 John" vs "John 3")
          }
        }

        // --- BRANCH 1: Text Search ---
        // Always run text search, but append it after navigation results
        let formattedResults: SearchResult[] = [];
        
        if (cleanQuery.length >= 2 && oramaDb.current) {
            const searchResult = await search(oramaDb.current, {
              term: cleanQuery,
              properties: ['cleanText', 'book', 'text'], 
              limit: 20,
              threshold: 0,
              boost: { book: 2 },
            });

            formattedResults = searchResult.hits.map(hit => ({
              type: 'verse',
              id: Number(hit.document.id),
              label: `${hit.document.book} ${toHebrewNumeral(Number(hit.document.chapter))}:${toHebrewNumeral(Number(hit.document.verse))}`,
              subLabel: hit.document.text,
              data: {
                id: Number(hit.document.id),
                book_name: hit.document.book,
                chapter: Number(hit.document.chapter),
                verse: Number(hit.document.verse),
                text: hit.document.text
              }
            }));
        }

        // Deduplicate: If a navigation result matches a text result ID, prefer the navigation one.
        const navIds = new Set(navResults.map(r => r.data?.id).filter(id => id > 0));
        const filteredTextResults = formattedResults.filter(r => !navIds.has(Number(r.id)));

        setResults([...navResults, ...filteredTextResults]);

      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(runSearch, 300);
    return () => clearTimeout(timeout);
  }, [query, isReady]);

  return { results, loading, isReady };
}
