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
  if (!text) return "";
  return text
    .replace(/\u05BE/g, " ") // החלפת מקף ברווח
    .replace(/[\u0591-\u05C7]/g, "") // הסרת ניקוד
    .replace(/\s+/g, " ") // צמצום רווחים כפולים
    .trim();
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
      console.log('[Orama] Initializing...');
      
      try {
        const bookRows = await db.getAllAsync<{שם: string}>('SELECT שם FROM ספרים ORDER BY מזהה ASC');
        allBooksRef.current = bookRows.map(b => b.שם);

        // CONFIG: Disable stemming for Hebrew accuracy
        oramaDb.current = await create({ 
            schema: BIBLE_SCHEMA,
            components: {
                tokenizer: {
                    stemming: false // חשוב מאוד לעברית!
                }
            }
        });

        const startTime = performance.now();
        const allVerses = await db.getAllAsync(`
          SELECT 
            p.מזהה as id, 
            s.שם as book, 
            p.פרק as chapter, 
            p.פסוק as verse, 
            p.תוכן as text,
            p.clean_text as cleanText
          FROM פסוקים p 
          JOIN ספרים s ON p.מזהה_ספר = s.מזהה
        `);

        const formattedVerses = allVerses.map((v: any) => {
            // עדיפות ל-cleanText מהדאטהבייס, אך במידה והוא ריק או null, ננקה ידנית
            let finalClean = v.cleanText;
            if (!finalClean || finalClean.trim().length === 0) {
                 finalClean = removeNikkud(v.text || '');
            } else {
                 finalClean = finalClean.trim(); // ניקוי רווחים מיותרים מהדאטהבייס
            }

            return {
                id: String(v.id || ''), 
                book: v.book || '',
                chapter: String(v.chapter || '0'),
                verse: String(v.verse || '0'),
                text: v.text || '',
                cleanText: finalClean, 
            };
        });

        await insertMultiple(oramaDb.current, formattedVerses);
        console.log(`[Orama] Indexing complete. ${formattedVerses.length} verses ready.`);
        
        // --- Sanity Check: נסה למצוא את בראשית א:א מיד ---
        const sanityCheck = await search(oramaDb.current, { term: 'בראשית ברא', properties: ['cleanText'], limit: 1 });
        console.log(`[Orama] SANITY CHECK: Searching "בראשית ברא" found ${sanityCheck.count} hits.`);
        
        setIsReady(true);
      } catch (e) {
        console.error('[Orama] Init failed:', e);
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
      const cleanQuery = removeNikkud(query);
      
      try {
        const navResults: SearchResult[] = [];
        const sortedBooks = [...allBooksRef.current].sort((a, b) => b.length - a.length);
        
        // --- NAVIGATION SEARCH ---
        let consumedByNav = false; // דגל שיסמן אם השאילתה היא ניווט מובהק

        for (const book of sortedBooks) {
          if (cleanQuery.startsWith(book)) {
            const remainder = cleanQuery.slice(book.length).trim();
            
            // 1. רק שם הספר
            if (remainder === '') {
                navResults.push({
                    type: 'verse', 
                    id: `nav-book-${book}`,
                    label: book,
                    subLabel: 'פתח את הספר',
                    data: { book_name: book, chapter: 1, verse: 1, text: '' }
                });
                consumedByNav = true;
            }

            // 2. שם הספר + פרק
            const parsed = parseLocation(remainder);
            if (parsed && !consumedByNav) {
              const chapNum = parseHebrewNumeral(parsed.chapterStr);
              const verseStartNum = parsed.verseStartStr ? parseHebrewNumeral(parsed.verseStartStr) : 0;
              const verseEndNum = parsed.verseEndStr ? parseHebrewNumeral(parsed.verseEndStr) : 0;

              // תיקון: אם המספר גדול מ-150 (תהילים), זה כנראה טקסט ולא פרק
              // "ברא" = 203, "היה" = 20 (יתכן פרק 20, אבל נבדוק אם קיים)
              if (chapNum > 0 && chapNum <= 151) {
                let sql = '';
                let params: any[] = [];
                
                if (verseStartNum > 0) {
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? AND p.פסוק = ? LIMIT 1`;
                   params = [book, chapNum, verseStartNum];
                } else {
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? LIMIT 1`;
                   params = [book, chapNum];
                }

                const row = await db.getFirstAsync<{מזהה: number, תוכן: string}>(sql, params);
                
                if (row) {
                    // מצאנו פרק אמיתי! זה ניווט.
                    const navId = `nav-${book}-${chapNum}-${verseStartNum || 1}-${verseEndNum || 'end'}`;
                    let label = `${book} ${toHebrewNumeral(chapNum)}`;
                    if (verseStartNum > 0) label += `:${toHebrewNumeral(verseStartNum)}`;
                    if (verseEndNum > 0) label += `-${toHebrewNumeral(verseEndNum)}`;

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
                    // לא מסמנים consumedByNav כדי לאפשר גם חיפוש טקסטואלי במקביל, למקרה שהמשתמש מחפש ביטוי
                } else {
                    console.log(`[Orama] '${remainder}' parsed as Chap ${chapNum} but not found. Treating as text.`);
                }
              }
            }
          }
        }

        // --- FULL TEXT SEARCH ---
        let formattedResults: SearchResult[] = [];
        
        if (cleanQuery.length >= 2 && oramaDb.current) {
            
            const searchResult = await search(oramaDb.current, {
              term: cleanQuery,
              properties: ['cleanText', 'text'], 
              limit: 20,
              threshold: 0.2, // מאפשר טעויות קטנות
              boost: { cleanText: 1.5 },
            });

            console.log(`[Orama] Query: "${cleanQuery}" -> Found ${searchResult.count} hits`);

            formattedResults = searchResult.hits.map(hit => ({
              type: 'verse',
              id: Number(hit.document.id),
              label: `${hit.document.book} ${toHebrewNumeral(Number(hit.document.chapter))}:${toHebrewNumeral(Number(hit.document.verse))}`,
              subLabel: hit.document.text as string,
              data: {
                id: Number(hit.document.id),
                book_name: hit.document.book,
                chapter: Number(hit.document.chapter),
                verse: Number(hit.document.verse),
                text: hit.document.text
              }
            }));
        }

        // Deduplication
        const navIds = new Set(navResults.map(r => r.data?.id).filter(id => id > 0));
        const filteredTextResults = formattedResults.filter(r => !navIds.has(Number(r.id)));

        setResults([...navResults, ...filteredTextResults]);

      } catch (e) {
        console.error('[Orama] Search error:', e);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(runSearch, 300);
    return () => clearTimeout(timeout);
  }, [query, isReady]);

  return { results, loading, isReady };
}
