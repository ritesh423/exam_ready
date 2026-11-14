import * as SQLite from "expo-sqlite";

export type NewExam = {
  name: string;
  examDate: string;
  reportingTime: string;
  leaveByTime: string | null;
  centerName: string;
  centerAddress: string;
  notes: string;
  reminderNotificationId: string | null;
};

export type ExamSummary = {
  id: number;
  name: string;
  examDate: string;
  reportingTime: string;
  centerName: string;
};

export type ExamDayDetails = ExamSummary & {
  leaveByTime: string | null;
  centerAddress: string;
  notes: string;
};

export type ExamPlan = ExamDayDetails & {
  admitCardUri: string | null;
  admitCardName: string | null;
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
          reminder_notification_id TEXT,
          admit_card_uri TEXT,
          admit_card_name TEXT,
          created_at TEXT NOT NULL
        );
      `);

      const columns = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(exams)",
      );
      if (!columns.some((column) => column.name === "admit_card_name")) {
        await db.execAsync("ALTER TABLE exams ADD COLUMN admit_card_name TEXT");
      }
      if (
        !columns.some((column) => column.name === "reminder_notification_id")
      ) {
        await db.execAsync(
          "ALTER TABLE exams ADD COLUMN reminder_notification_id TEXT",
        );
        await db.execAsync("UPDATE exams SET reminder_enabled = 0");
      }

      return db;
    })().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

export async function saveExam(exam: NewExam): Promise<number> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `INSERT INTO exams (
      name, exam_date, reporting_time, leave_by_time,
      center_name, center_address, notes, reminder_enabled,
      reminder_notification_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exam.name,
      exam.examDate,
      exam.reportingTime,
      exam.leaveByTime,
      exam.centerName,
      exam.centerAddress,
      exam.notes,
      exam.reminderNotificationId ? 1 : 0,
      exam.reminderNotificationId,
      new Date().toISOString(),
    ],
  );

  return result.lastInsertRowId;
}

export async function listExams(): Promise<ExamSummary[]> {
  const db = await getDatabase();

  return db.getAllAsync<ExamSummary>(
    `SELECT
      id,
      name,
      exam_date AS examDate,
      reporting_time AS reportingTime,
      center_name AS centerName
    FROM exams
    ORDER BY exam_date ASC, reporting_time ASC, id ASC`,
  );
}

export async function listUpcomingExamDetails(
  fromDate: string,
): Promise<ExamDayDetails[]> {
  const db = await getDatabase();

  return db.getAllAsync<ExamDayDetails>(
    `SELECT
      id,
      name,
      exam_date AS examDate,
      reporting_time AS reportingTime,
      leave_by_time AS leaveByTime,
      center_name AS centerName,
      center_address AS centerAddress,
      notes
    FROM exams
    WHERE exam_date >= ?
    ORDER BY exam_date ASC, reporting_time ASC, id ASC`,
    [fromDate],
  );
}

export async function getExamPlan(id: number): Promise<ExamPlan | null> {
  const db = await getDatabase();

  return db.getFirstAsync<ExamPlan>(
    `SELECT
      id,
      name,
      exam_date AS examDate,
      reporting_time AS reportingTime,
      leave_by_time AS leaveByTime,
      center_name AS centerName,
      center_address AS centerAddress,
      notes,
      admit_card_uri AS admitCardUri,
      admit_card_name AS admitCardName
    FROM exams
    WHERE id = ?`,
    [id],
  );
}

export async function setAdmitCard(
  id: number,
  fileName: string | null,
  displayName: string | null,
): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "UPDATE exams SET admit_card_uri = ?, admit_card_name = ? WHERE id = ?",
    [fileName, displayName, id],
  );
  if (result.changes !== 1) throw new Error("Exam not found");
}
