import * as SQLite from "expo-sqlite";

export type NewExam = {
  name: string;
  examDate: string;
  reportingTime: string;
  leaveByTime: string | null;
  centerName: string;
  centerAddress: string;
  notes: string;
  reminderEnabled: boolean;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync("examready.db");

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          exam_date TEXT NOT NULL,
          reporting_time TEXT NOT NULL,
          leave_by_time TEXT,
          center_name TEXT NOT NULL,
          center_address TEXT NOT NULL,
          notes TEXT NOT NULL,
          reminder_enabled INTEGER NOT NULL DEFAULT 0,
          admit_card_uri TEXT,
          created_at TEXT NOT NULL
        );
      `);

      return db;
    })();
  }

  return databasePromise;
}

export async function saveExam(exam: NewExam): Promise<number> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `INSERT INTO exams (
      name, exam_date, reporting_time, leave_by_time,
      center_name, center_address, notes, reminder_enabled, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exam.name,
      exam.examDate,
      exam.reportingTime,
      exam.leaveByTime,
      exam.centerName,
      exam.centerAddress,
      exam.notes,
      exam.reminderEnabled ? 1 : 0,
      new Date().toISOString(),
    ],
  );

  return result.lastInsertRowId;
}
