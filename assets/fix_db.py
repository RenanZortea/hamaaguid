import sqlite3

def fix_bible_db_hebrew():
    db_path = 'bible.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add new columns
    try:
        cursor.execute("ALTER TABLE verses ADD COLUMN tanakh_id INTEGER")
        cursor.execute("ALTER TABLE verses ADD COLUMN book_hebrew TEXT")
    except sqlite3.OperationalError:
        print("Columns might already exist. Proceeding with update...")

    # 2. Define the Mapping: English Name -> (Tanakh Order, Hebrew Name)
    tanakh_mapping = {
        # --- TORAH (The Law) ---
        "Genesis": (1, "בראשית"),
        "Exodus": (2, "שמות"),
        "Leviticus": (3, "ויקרא"),
        "Numbers": (4, "במדבר"),
        "Deuteronomy": (5, "דברים"),
        
        # --- NEVI'IM (The Prophets) ---
        # Former Prophets
        "Joshua": (6, "יהושע"),
        "Judges": (7, "שופטים"),
        "I Samuel": (8, "שמואל א"),
        "II Samuel": (9, "שמואל ב"),
        "I Kings": (10, "מלכים א"),
        "II Kings": (11, "מלכים ב"),
        
        # Latter Prophets
        "Isaiah": (12, "ישעיהו"),
        "Jeremiah": (13, "ירמיהו"),
        "Ezekiel": (14, "יחזקאל"),
        
        # The Twelve (Trei Asar)
        "Hosea": (15, "הושע"),
        "Joel": (16, "יואל"),
        "Amos": (17, "עמוס"),
        "Obadiah": (18, "עובדיה"),
        "Jonah": (19, "יונה"),
        "Micah": (20, "מיכה"),
        "Nahum": (21, "נחום"),
        "Habakkuk": (22, "חבקוק"),
        "Zephaniah": (23, "צפניה"),
        "Haggai": (24, "חגי"),
        "Zechariah": (25, "זכריה"),
        "Malachi": (26, "מלאכי"),
        
        # --- KETUVIM (The Writings) ---
        "Psalms": (27, "תהילים"),
        "Proverbs": (28, "משלי"),
        "Job": (29, "איוב"),
        "Song of Songs": (30, "שיר השירים"),
        "Ruth": (31, "רות"),
        "Lamentations": (32, "איכה"),
        "Ecclesiastes": (33, "קהלת"),
        "Esther": (34, "אסתר"),
        "Daniel": (35, "דניאל"),
        "Ezra": (36, "עזרא"),
        "Nehemiah": (37, "נחמיה"),
        "I Chronicles": (38, "דברי הימים א"),
        "II Chronicles": (39, "דברי הימים ב")
    }

    print("Updating database with Hebrew names and Tanakh order...")

    # 3. Perform the Update
    for eng_name, (order, heb_name) in tanakh_mapping.items():
        cursor.execute("""
            UPDATE verses 
            SET tanakh_id = ?, book_hebrew = ? 
            WHERE book_id = ?
        """, (order, heb_name, eng_name))

    conn.commit()
    print("Update complete.")

    # 4. Verification: Print the first 10 books to show they are in Hebrew and sorted correctly
    print("\nVerification (First 10 books in Tanakh order):")
    cursor.execute("SELECT DISTINCT tanakh_id, book_hebrew FROM verses ORDER BY tanakh_id LIMIT 10")
    for row in cursor.fetchall():
        print(f"{row[0]}. {row[1]}")

    conn.close()

if __name__ == "__main__":
    fix_bible_db_hebrew()