export interface BibleBook {
  id: string;
  label: string;
  chapters: number;
}

export interface BibleCategory {
  id: string;
  label: string;
  books: BibleBook[];
}

export const BIBLE_STRUCTURE: BibleCategory[] = [
  {
    id: 'Torah',
    label: 'תורה',
    books: [
      { id: 'בראשית', label: 'בראשית', chapters: 50 },
      { id: 'שמות', label: 'שמות', chapters: 40 },
      { id: 'ויקרא', label: 'ויקרא', chapters: 27 },
      { id: 'במדבר', label: 'במדבר', chapters: 36 },
      { id: 'דברים', label: 'דברים', chapters: 34 },
    ],
  },
  {
    id: 'Neviim',
    label: 'נביאים',
    books: [
      { id: 'יהושע', label: 'יהושע', chapters: 24 },
      { id: 'שופטים', label: 'שופטים', chapters: 21 },
      { id: 'שמואל א', label: 'שמואל א', chapters: 31 },
      { id: 'שמואל ב', label: 'שמואל ב', chapters: 24 },
      { id: 'מלכים א', label: 'מלכים א', chapters: 22 },
      { id: 'מלכים ב', label: 'מלכים ב', chapters: 25 },
      { id: 'ישעיהו', label: 'ישעיהו', chapters: 66 },
      { id: 'ירמיהו', label: 'ירמיהו', chapters: 52 },
      { id: 'יחזקאל', label: 'יחזקאל', chapters: 48 },
      { id: 'הושע', label: 'הושע', chapters: 14 },
      { id: 'יואל', label: 'יואל', chapters: 4 },
      { id: 'עמוס', label: 'עמוס', chapters: 9 },
      { id: 'עובדיה', label: 'עובדיה', chapters: 1 },
      { id: 'יונה', label: 'יונה', chapters: 4 },
      { id: 'מיכה', label: 'מיכה', chapters: 7 },
      { id: 'נחום', label: 'נחום', chapters: 3 },
      { id: 'חבקוק', label: 'חבקוק', chapters: 3 },
      { id: 'צפניה', label: 'צפניה', chapters: 3 },
      { id: 'חגי', label: 'חגי', chapters: 2 },
      { id: 'זכריה', label: 'זכריה', chapters: 14 },
      { id: 'מלאכי', label: 'מלאכי', chapters: 3 },
    ],
  },
  {
    id: 'Ketuvim',
    label: 'כתובים',
    books: [
      { id: 'תהילים', label: 'תהילים', chapters: 150 },
      { id: 'משלי', label: 'משלי', chapters: 31 },
      { id: 'איוב', label: 'איוב', chapters: 42 },
      { id: 'שיר השירים', label: 'שיר השירים', chapters: 8 },
      { id: 'רות', label: 'רות', chapters: 4 },
      { id: 'איכה', label: 'איכה', chapters: 5 },
      { id: 'קהלת', label: 'קהלת', chapters: 12 },
      { id: 'אסתר', label: 'אסתר', chapters: 10 },
      { id: 'דניאל', label: 'דניאל', chapters: 12 },
      { id: 'עזרא', label: 'עזרא', chapters: 10 },
      { id: 'נחמיה', label: 'נחמיה', chapters: 13 },
      { id: 'דברי הימים א', label: 'דברי הימים א', chapters: 29 },
      { id: 'דברי הימים ב', label: 'דברי הימים ב', chapters: 36 },
    ],
  },
  {
    id: 'BritChadasha',
    label: 'הברית החדשה',
    books: [
      { id: 'מתי', label: 'מתי', chapters: 28 },
      { id: 'מרקוס', label: 'מרקוס', chapters: 16 },
      { id: 'לוקס', label: 'לוקס', chapters: 24 },
      { id: 'יוחנן', label: 'יוחנן', chapters: 21 },
      { id: 'מעשים', label: 'מעשים', chapters: 28 },
      { id: 'רומים', label: 'רומים', chapters: 16 },
      { id: 'קורינתיים א', label: 'קורינתיים א', chapters: 16 },
      { id: 'קורינתיים ב', label: 'קורינתיים ב', chapters: 13 },
      { id: 'גלטים', label: 'גלטים', chapters: 6 },
      { id: 'אפסים', label: 'אפסים', chapters: 6 },
      { id: 'פיליפים', label: 'פיליפים', chapters: 4 },
      { id: 'קולוסים', label: 'קולוסים', chapters: 4 },
      { id: 'תסלוניקים א', label: 'תסלוניקים א', chapters: 5 },
      { id: 'תסלוניקים ב', label: 'תסלוניקים ב', chapters: 3 },
      { id: 'טימותיאוס א', label: 'טימותיאוס א', chapters: 6 },
      { id: 'טימותיאוס ב', label: 'טימותיאוס ב', chapters: 4 },
      { id: 'תיטוס', label: 'תיטוס', chapters: 3 },
      { id: 'פילימון', label: 'פילימון', chapters: 1 },
      { id: 'עברים', label: 'עברים', chapters: 13 },
      { id: 'יעקב', label: 'יעקב', chapters: 5 },
      { id: 'פטרוס א', label: 'פטרוס א', chapters: 5 },
      { id: 'פטרוס ב', label: 'פטרוס ב', chapters: 3 },
      { id: 'יוחנן א', label: 'יוחנן א', chapters: 5 },
      { id: 'יוחנן ב', label: 'יוחנן ב', chapters: 1 },
      { id: 'יוחנן ג', label: 'יוחנן ג', chapters: 1 },
      { id: 'יהודה', label: 'יהודה', chapters: 1 },
      { id: 'התגלות', label: 'התגלות', chapters: 22 },
    ],
  },
];
