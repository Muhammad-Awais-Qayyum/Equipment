import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signIn as authSignIn, signOut as authSignOut, getCurrentUser, getSession, seedDefaultAdmin } from '../lib/auth';
import { db, seedDatabase } from '../lib/db';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'sports_captain';
}

interface LocalSession {
  user: {
    id: string;
    email: string;
  };
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  session: LocalSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await seedDatabase();
        await seedDefaultAdmin();

        const localSession = getSession();
        if (localSession) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser({ id: currentUser.id, email: currentUser.email });
            setProfile({
              id: currentUser.id,
              email: currentUser.email,
              full_name: currentUser.full_name,
              role: currentUser.role,
            });
            setSession({
              user: {
                id: currentUser.id,
                email: currentUser.email,
              },
            });
          } else {
            authSignOut();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const user = await db.users.get(userId);
      if (user) {
        setProfile({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function signIn(email: string, password: string) {
    const user = await authSignIn(email, password);
    setUser({ id: user.id, email: user.email });
    setProfile({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
    setSession({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  }

  async function signOut() {
    authSignOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  async function refreshProfile() {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
