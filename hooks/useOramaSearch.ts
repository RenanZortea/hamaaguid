import { parseHebrewNumeral, toHebrewNumeral } from '@/utils/hebrewNumerals';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import FlexSearch from 'flexsearch/dist/flexsearch.bundle.min.js';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export interface SearchResult {
  type: 'book' | 'verse';
  id: string | number;
  label: string;
  subLabel?: string;
  data?: any;
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
  
  const flexIndex = useRef<any>(null);
  const allBooksRef = useRef<string[]>([]);

  // 1. Initialize FlexSearch from Pre-computed Index (Async Asset Load)
  useEffect(() => {
    async function init() {
      if (flexIndex.current) return;
      console.log('[FlexSearch] Initializing from asset...');
      
      try {
        const bookRows = await db.getAllAsync<{שם: string}>('SELECT שם FROM ספרים ORDER BY מזהה ASC');
        allBooksRef.current = bookRows.map(b => b.שם);

        // Configure FlexSearch
        flexIndex.current = new FlexSearch.Document({
            id: "id",
            index: ["cleanText"], 
            tokenize: "forward", 
            context: false,
            cache: true,
            worker: false
        });

        console.time('Import Index');
        
        // ---------------------------------------------------------
        // CRITICAL FIX: Load Large JSON as Raw Asset (Not Module)
        // ---------------------------------------------------------
        
        // 1. Reference the .data file (Must be renamed from .json)
        // Note: Ensure you have global.d.ts configured to allow *.data imports
        const indexAsset = Asset.fromModule(require('@/assets/search-index.data'));
        
        // 2. Ensure the asset is downloaded to the local filesystem
        await indexAsset.downloadAsync();
        
        // 3. Read the file content string from the local cache
        const uri = indexAsset.localUri || indexAsset.uri;
        if (!uri) {
           throw new Error('Failed to resolve search index URI');
        }

        const jsonString = await FileSystem.readAsStringAsync(uri);
        const indexData = JSON.parse(jsonString);

        // 4. Import keys into FlexSearch
        const keys = Object.keys(indexData);
        keys.forEach(key => {
            flexIndex.current.import(key, indexData[key]);
        });
        
        console.timeEnd('Import Index');
        
        // Sanity Check
        const sanity = await flexIndex.current.search("בראשית", { limit: 1 });
        console.log(`[FlexSearch] Sanity check "בראשית" matches:`, sanity.length > 0);
        
        setIsReady(true);
      } catch (e) {
        console.error('[FlexSearch] Init failed:', e);
      }
    }
    init();
  }, [db]);

  // 2. Run Search Logic
  useEffect(() => {
    async function runSearch() {
      // If index isn't ready or query is empty, clear results
      if (!isReady || !flexIndex.current || !query || query.length < 1) {
        setResults([]);
        return;
      }

      setLoading(true);
      const cleanQuery = query.replace(/[\u0591-\u05C7]/g, "").trim();
      
      try {
        const navResults: SearchResult[] = [];
        const sortedBooks = [...allBooksRef.current].sort((a, b) => b.length - a.length);

        // --- A. NAVIGATION SEARCH (Exact Book/Chapter references) ---
        for (const book of sortedBooks) {
          if (cleanQuery.startsWith(book)) {
            const remainder = cleanQuery.slice(book.length).trim();
            
            // 1. Book only match
            if (remainder === '') {
                navResults.push({
                    type: 'verse', 
                    id: `nav-book-${book}`,
                    label: book,
                    subLabel: 'פתח את הספר',
                    data: { book_name: book, chapter: 1, verse: 1, text: '' }
                });
            }

            // 2. Book + Chapter/Verse match
            const parsed = parseLocation(remainder);
            if (parsed) {
              const chapNum = parseHebrewNumeral(parsed.chapterStr);
              const verseStartNum = parsed.verseStartStr ? parseHebrewNumeral(parsed.verseStartStr) : 0;
              const verseEndNum = parsed.verseEndStr ? parseHebrewNumeral(parsed.verseEndStr) : 0;

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
                }
              }
            }
          }
        }

        // --- B. FULL TEXT SEARCH (FlexSearch) ---
        let formattedResults: SearchResult[] = [];
        
        if (cleanQuery.length >= 2) {
            const rawResults = await flexIndex.current.search(cleanQuery, { limit: 20 });
            // rawResults format: [{ field: 'cleanText', result: [id, id...] }]
            
            const uniqueIds = new Set<string>();
            rawResults.forEach((fieldRes: any) => {
                fieldRes.result.forEach((id: string) => uniqueIds.add(id));
            });
            
            const idsArray = Array.from(uniqueIds);

            if (idsArray.length > 0) {
                // Fetch full verse details from DB using IDs found in index
                const placeholders = idsArray.map(() => '?').join(',');
                const verses = await db.getAllAsync(`
                    SELECT 
                        p.מזהה as id, 
                        s.שם as book, 
                        p.פרק as chapter, 
                        p.פסוק as verse, 
                        p.תוכן as text
                    FROM פסוקים p 
                    JOIN ספרים s ON p.מזהה_ספר = s.מזהה
                    WHERE p.מזהה IN (${placeholders})
                `, idsArray);
                
                const versesMap = new Map(verses.map((v: any) => [String(v.id), v]));
                
                formattedResults = idsArray
                    .map(id => versesMap.get(String(id)))
                    .filter(Boolean)
                    .map((v: any) => ({
                        type: 'verse',
                        id: Number(v.id),
                        label: `${v.book} ${toHebrewNumeral(v.chapter)}:${toHebrewNumeral(v.verse)}`,
                        subLabel: v.text,
                        data: {
                            id: Number(v.id),
                            book_name: v.book,
                            chapter: Number(v.chapter),
                            verse: Number(v.verse),
                            text: v.text
                        }
                    }));
            }
        }

        // --- C. MERGE & DEDUPLICATE ---
        // Remove text results that are already covered by navigation results
        const navIds = new Set(navResults.map(r => r.data?.id).filter(id => id > 0));
        const filteredTextResults = formattedResults.filter(r => !navIds.has(Number(r.id)));

        setResults([...navResults, ...filteredTextResults]);

      } catch (e) {
        console.error('[FlexSearch] Search error:', e);
      } finally {
        setLoading(false);
      }
    }

    // Debounce search by 300ms
    const timeout = setTimeout(runSearch, 300);
    return () => clearTimeout(timeout);
  }, [query, isReady]);

  return { results, loading, isReady };
}
