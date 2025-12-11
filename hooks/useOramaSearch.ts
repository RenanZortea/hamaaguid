import { parseHebrewNumeral, toHebrewNumeral } from '@/utils/hebrewNumerals';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import FlexSearch from 'flexsearch/dist/flexsearch.bundle.min.js';

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
  const versesStore = useRef<Map<string, any>>(new Map()); // Store full verse data to avoid DB lookups during search

  // 1. Initialize FlexSearch
  useEffect(() => {
    async function init() {
      if (flexIndex.current) return;
      console.log('[FlexSearch] Initializing...');
      
      try {
        const bookRows = await db.getAllAsync<{שם: string}>('SELECT שם FROM ספרים ORDER BY מזהה ASC');
        allBooksRef.current = bookRows.map(b => b.שם);

        // CONFIG: FlexSearch for Hebrew
        flexIndex.current = new FlexSearch.Document({
            id: "id",
            index: ["cleanText"], // Only index clean text for speed (text with Nikkud is covered by store)
            tokenize: "forward", // Good for partial matches
            context: false,
            cache: true,
            worker: false
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

        console.log(`[FlexSearch] Loaded ${allVerses.length} verses from DB.`);

        // Batch add
        allVerses.forEach((v: any) => {
            const id = String(v.id);
            const doc = {
                id: id,
                book: v.book,
                chapter: v.chapter,
                verse: v.verse,
                text: v.text,
                cleanText: v.cleanText
            };
            
            flexIndex.current.add(doc);
            versesStore.current.set(id, doc);
        });
        
        console.log(`[FlexSearch] Indexing complete in ${Math.round(performance.now() - startTime)}ms`);
        
        // --- SANITY CHECK ---
        const sanity = await flexIndex.current.search("בראשית", { limit: 1 });
        console.log(`[FlexSearch] Sanity check "בראשית" found matches:`, sanity.length > 0);
        
        setIsReady(true);
      } catch (e) {
        console.error('[FlexSearch] Init failed:', e);
      }
    }
    init();
  }, [db]);

  // 2. Run Search
  useEffect(() => {
    async function runSearch() {
      if (!isReady || !flexIndex.current || !query || query.length < 1) {
        setResults([]);
        return;
      }

      setLoading(true);
      // Clean query for better matching, though FlexSearch handles some
      const cleanQuery = query.replace(/[\u0591-\u05C7]/g, "").trim();
      
      try {
        const navResults: SearchResult[] = [];
        const sortedBooks = [...allBooksRef.current].sort((a, b) => b.length - a.length);
        
        // --- NAVIGATION SEARCH (Same logic as before) ---

        for (const book of sortedBooks) {
          if (cleanQuery.startsWith(book)) {
            const remainder = cleanQuery.slice(book.length).trim();
            
            // 1. Book only
            if (remainder === '') {
                navResults.push({
                    type: 'verse', 
                    id: `nav-book-${book}`,
                    label: book,
                    subLabel: 'פתח את הספר',
                    data: { book_name: book, chapter: 1, verse: 1, text: '' }
                });
            }

            // 2. Book + Chapter
            const parsed = parseLocation(remainder);
            if (parsed) {
              const chapNum = parseHebrewNumeral(parsed.chapterStr);
              const verseStartNum = parsed.verseStartStr ? parseHebrewNumeral(parsed.verseStartStr) : 0;
              const verseEndNum = parsed.verseEndStr ? parseHebrewNumeral(parsed.verseEndStr) : 0;

              if (chapNum > 0 && chapNum <= 151) {
                // Fetch specific verse for navigation prompt
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

        // --- FULL TEXT SEARCH (FlexSearch) ---
        let formattedResults: SearchResult[] = [];
        
        if (cleanQuery.length >= 2) {
            // Search in both fields
            const searchRes = await flexIndex.current.search(cleanQuery, {
                limit: 20,
                enrich: true // Get the full document back? No, FlexSearch Document search returns field specific results.
            });
            
            // FlexSearch Document result format: [{ field: 'cleanText', result: [id1, id2...] }]
            // If enrichment is not easy, we just get IDs and look up in versesStore.
            
            // Let's assume we get IDs.
            // Using "enrich: false" returns IDs.
            // But wait, "enrich: true" in FlexSearch returns document content depending on config.
            // It is safer to just get IDs and map from our Map.
            
            const rawResults = await flexIndex.current.search(cleanQuery, { limit: 20 });
            // rawResults is array of results for each field: [{ field: 'cleanText', result: [id, id...] }, ...]
            
            const uniqueIds = new Set<string>();
            rawResults.forEach((fieldRes: any) => {
                fieldRes.result.forEach((id: string) => uniqueIds.add(id));
            });

            const hits: any[] = [];
            uniqueIds.forEach(id => {
                if (versesStore.current.has(id)) {
                    hits.push(versesStore.current.get(id));
                }
            });

            formattedResults = hits.map(hit => ({
              type: 'verse',
              id: Number(hit.id),
              label: `${hit.book} ${toHebrewNumeral(Number(hit.chapter))}:${toHebrewNumeral(Number(hit.verse))}`,
              subLabel: hit.text,
              data: {
                id: Number(hit.id),
                book_name: hit.book,
                chapter: Number(hit.chapter),
                verse: Number(hit.verse),
                text: hit.text
              }
            }));
        }

        // Deduplication
        const navIds = new Set(navResults.map(r => r.data?.id).filter(id => id > 0));
        const filteredTextResults = formattedResults.filter(r => !navIds.has(Number(r.id)));

        setResults([...navResults, ...filteredTextResults]);

      } catch (e) {
        console.error('[FlexSearch] Search error:', e);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(runSearch, 300);
    return () => clearTimeout(timeout);
  }, [query, isReady]);

  return { results, loading, isReady };
}
