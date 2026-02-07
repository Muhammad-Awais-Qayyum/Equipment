import bcrypt from 'bcryptjs';
import { db, User } from './db';
import { generateUUID } from './db';

const SESSION_KEY = 'equipment_session';
const SESSION_USER_KEY = 'equipment_user';

export interface Session {
  user_id: string;
  email: string;
  expires_at: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSession(user: User): void {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const session: Session = {
    user_id: user.id,
    email: user.email,
    expires_at: expiresAt.toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function getSession(): Session | null {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;

  try {
    const session: Session = JSON.parse(sessionStr);
    const expiresAt = new Date(session.expires_at);

    if (expiresAt < new Date()) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = getSession();
  if (!session) return null;

  const user = await db.users.get(session.user_id);
  return user || null;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
}

export async function signIn(email: string, password: string): Promise<User> {
  const user = await db.users.where('email').equals(email).first();

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  createSession(user);
  return user;
}

export function signOut(): void {
  clearSession();
}

export async function createUser(
  email: string,
  password: string,
  fullName: string,
  role: 'admin' | 'sports_captain' = 'sports_captain'
): Promise<User> {
  const existing = await db.users.where('email').equals(email).first();
  if (existing) {
    throw new Error('User with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const user: User = {
    id: generateUUID(),
    email,
    full_name: fullName,
    role,
    password_hash: passwordHash,
    created_at: now,
    updated_at: now,
  };

  await db.users.add(user);
  return user;
}

export async function seedDefaultAdmin(): Promise<void> {
  const existingAdmin = await db.users.where('email').equals('admin@school.edu').first();
  if (existingAdmin) {
    return;
  }

  await createUser('admin@school.edu', 'admin123', 'Admin User', 'admin');
}

export async function getAllUsers(): Promise<User[]> {
  return db.users.toArray();
}

export async function updateUser(
  userId: string,
  updates: {
    email?: string;
    full_name?: string;
    role?: 'admin' | 'sports_captain';
  }
): Promise<User> {
  const user = await db.users.get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (updates.email && updates.email !== user.email) {
    const existing = await db.users.where('email').equals(updates.email).first();
    if (existing) {
      throw new Error('User with this email already exists');
    }
  }

  const now = new Date().toISOString();
  await db.users.update(userId, {
    ...updates,
    updated_at: now,
  });

  const updatedUser = await db.users.get(userId);
  return updatedUser!;
}

export async function deleteUser(userId: string): Promise<void> {
  const user = await db.users.get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await db.users.delete(userId);
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  const user = await db.users.get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const passwordHash = await hashPassword(newPassword);
  const now = new Date().toISOString();

  await db.users.update(userId, {
    password_hash: passwordHash,
    updated_at: now,
  });
}

