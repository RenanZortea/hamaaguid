export function toHebrewNumeral(n: number): string {
  if (n <= 0) return '';
  
  // Handle special religious cases for 15 and 16 to avoid writing Divine names
  // 15 = 9 + 6 (tet-vav) instead of 10 + 5 (yud-hey)
  // 16 = 9 + 7 (tet-zayin) instead of 10 + 6 (yud-vav)
  const specialCases: Record<number, string> = {
    15: 'טו',
    16: 'טז',
  };

  // If the number is exactly 15 or 16, or ends in 15/16 (like 115), logic can vary.
  // For chapter/verse numbers (usually < 200), checking the remainder is usually sufficient.
  if (specialCases[n]) return specialCases[n];

  const letters = [
    { val: 400, char: 'ת' },
    { val: 300, char: 'ש' },
    { val: 200, char: 'ר' },
    { val: 100, char: 'ק' },
    { val: 90, char: 'צ' },
    { val: 80, char: 'פ' },
    { val: 70, char: 'ע' },
    { val: 60, char: 'ס' },
    { val: 50, char: 'נ' },
    { val: 40, char: 'מ' },
    { val: 30, char: 'ל' },
    { val: 20, char: 'כ' },
    { val: 10, char: 'י' },
    { val: 9, char: 'ט' },
    { val: 8, char: 'ח' },
    { val: 7, char: 'ז' },
    { val: 6, char: 'ו' },
    { val: 5, char: 'ה' },
    { val: 4, char: 'ד' },
    { val: 3, char: 'ג' },
    { val: 2, char: 'ב' },
    { val: 1, char: 'א' },
  ];

  let result = '';
  let remainder = n;

  while (remainder > 0) {
    // Handle the 15/16 case for numbers > 16 (e.g. 115) if needed, 
    // though rarely an issue for Bible chapters/verses except Psalms.
    if (remainder === 15) { result += 'טו'; break; }
    if (remainder === 16) { result += 'טז'; break; }

    for (const item of letters) {
      if (remainder >= item.val) {
        result += item.char;
        remainder -= item.val;
        break;
      }
    }
  }

  return result;
}
