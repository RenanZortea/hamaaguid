import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const useUserDb = () => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('user.db');
  }
  return dbInstance;
};

export const initUserDb = async () => {
  const db = useUserDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reading_progress (
      plan_id TEXT PRIMARY KEY NOT NULL,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      last_read_date TEXT,
      is_completed BOOLEAN DEFAULT 0
    );
  `);
};
