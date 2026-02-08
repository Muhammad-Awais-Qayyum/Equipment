import Dexie, { Table } from 'dexie';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'sports_captain';
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  year_group: string;
  class_name: string | null;
  house: string | null;
  email: string | null;
  avatar_url: string | null;
  trust_score: number;
  is_blacklisted: boolean;
  blacklist_end_date: string | null;
  blacklist_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentItem {
  id: string;
  item_id: string;
  name: string;
  category: string;
  image_url: string | null;
  location: string | null;
  status: 'available' | 'borrowed' | 'reserved' | 'repair' | 'lost' | 'damaged';
  condition_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  student_id: string;
  equipment_id: string;
  borrowed_by_user_id: string | null;
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
  is_overdue: boolean;
  status: 'active' | 'returned' | 'overdue';
  created_at: string;
}

export interface Reservation {
  id: string;
  student_id: string;
  equipment_id: string;
  reserved_by_user_id: string | null;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface BlacklistEntry {
  id: string;
  student_id: string;
  blacklisted_by_user_id: string | null;
  start_date: string;
  end_date: string;
  reason: string;
  is_active: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  school_name: string;
  academic_year: string;
  overdue_alerts_enabled: boolean;
  low_stock_warnings_enabled: boolean;
  email_digest_frequency: 'daily' | 'weekly';
  borrow_history_retention_months: number;
  require_student_id: boolean;
  app_version: string;
  school_logo_url: string | null;
  categories: string[]; // Array of category names
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

class EquipmentDatabase extends Dexie {
  users!: Table<User, string>;
  students!: Table<Student, string>;
  equipment!: Table<EquipmentItem, string>;
  loans!: Table<Loan, string>;
  reservations!: Table<Reservation, string>;
  blacklistEntries!: Table<BlacklistEntry, string>;
  settings!: Table<Settings, string>;
  activityLogs!: Table<ActivityLog, string>;

  constructor() {
    super('EquipmentDB');

    this.version(1).stores({
      users: 'id, email',
      students: 'id, student_id, full_name',
      equipment: 'id, item_id, status, category',
      loans: 'id, student_id, equipment_id, status',
      reservations: 'id, student_id, equipment_id',
      blacklistEntries: 'id, student_id',
      settings: 'id',
      activityLogs: 'id, user_id',
    });
  }
}

export const db = new EquipmentDatabase();

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function seedDatabase() {
  const existingSettings = await db.settings.count();
  if (existingSettings > 0) {
    return;
  }

  const defaultSettings: Settings = {
    id: generateUUID(),
    school_name: 'Springfield Sports Academy',
    academic_year: '2024',
    overdue_alerts_enabled: true,
    low_stock_warnings_enabled: true,
    email_digest_frequency: 'daily',
    borrow_history_retention_months: 12,
    require_student_id: true,
    app_version: '1.0.0',
    school_logo_url: null,
    categories: ['Basketball', 'Football', 'Soccer', 'Tennis', 'Volleyball', 'Other'],
    updated_at: new Date().toISOString(),
  };

  await db.settings.add(defaultSettings);
}

export async function calculateTrustScore(studentId: string): Promise<number> {
  const student = await db.students.get(studentId);
  if (!student) return 50.0;

  // Get all returned loans, sorted by return date (oldest first)
  const allLoans = await db.loans
    .where('student_id')
    .equals(studentId)
    .and(loan => loan.returned_at !== null)
    .toArray();

  if (allLoans.length === 0) {
    // No returns yet, start at 50%
    return 50.0;
  }

  // Sort by return date (oldest first) to process in chronological order
  allLoans.sort((a, b) => {
    const dateA = a.returned_at ? new Date(a.returned_at).getTime() : 0;
    const dateB = b.returned_at ? new Date(b.returned_at).getTime() : 0;
    return dateA - dateB;
  });

  // Start with base score of 50%
  let score = 50.0;

  // Process each return incrementally
  for (const loan of allLoans) {
    if (loan.returned_at && loan.due_at) {
      const returnedDate = new Date(loan.returned_at);
      const dueDate = new Date(loan.due_at);
      const isOnTime = returnedDate <= dueDate;

      if (isOnTime) {
        // Increase by 50% (multiply by 1.5), capped at 100%
        score = Math.min(100.0, score * 1.5);
      } else {
        // Decrease by 50% (multiply by 0.5)
        score = score * 0.5;
      }
    }
  }
  
  return Math.max(0, Math.round(score * 10) / 10);
}

export async function updateLoanStatus(loanId: string) {
  const loan = await db.loans.get(loanId);
  if (!loan) return;

  const now = new Date();
  const dueDate = new Date(loan.due_at);
  const isOverdue = !loan.returned_at && dueDate < now;

  await db.loans.update(loanId, {
    is_overdue: isOverdue,
    status: loan.returned_at ? 'returned' : isOverdue ? 'overdue' : 'active',
  });
}

export async function updateStudentTrustScore(studentId: string, returnedLoan?: { returned_at: string; due_at: string }) {
  try {
    const student = await db.students.get(studentId);
    if (!student) return;

    // If a specific loan was just returned, adjust score based on that return
    if (returnedLoan && returnedLoan.returned_at && returnedLoan.due_at) {
      const returnedDate = new Date(returnedLoan.returned_at);
      const dueDate = new Date(returnedLoan.due_at);
      const isOnTime = returnedDate <= dueDate;
      
      const currentScore = student.trust_score || 50.0;
      let newScore: number;
      
      if (isOnTime) {
        // Increase by 50% (multiply by 1.5), capped at 100%
        newScore = Math.min(100.0, currentScore * 1.5);
      } else {
        // Decrease by 50% (multiply by 0.5)
        newScore = currentScore * 0.5;
      }
      
      await db.students.update(studentId, {
        trust_score: Math.max(0, Math.round(newScore * 10) / 10),
        updated_at: new Date().toISOString(),
      });
    } else {
      // Fallback: recalculate from all returns if no specific loan provided
      const trustScore = await calculateTrustScore(studentId);
      await db.students.update(studentId, {
        trust_score: trustScore,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error updating trust score:', error);
  }
}

// Utility function to recalculate all student trust scores
export async function recalculateAllTrustScores() {
  try {
    const students = await db.students.toArray();
    await Promise.all(
      students.map(async (student) => {
        const trustScore = await calculateTrustScore(student.id);
        await db.students.update(student.id, {
          trust_score: trustScore,
          updated_at: new Date().toISOString(),
        });
      })
    );
  } catch (error) {
    console.error('Error recalculating all trust scores:', error);
  }
}

