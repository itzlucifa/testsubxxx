import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '../lib/auth';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    console.log('🔐 AuthProvider: Checking current user...');
    authService.getCurrentUser().then((user) => {
      console.log('🔐 AuthProvider: User found:', user);
      setUser(user);
    }).finally(() => {
      console.log('🔐 AuthProvider: Loading complete');
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      console.log('🔐 AuthProvider: Auth state changed:', user);
      setUser(user);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await authService.signIn({ email, password });
    const user = await authService.getCurrentUser();
    setUser(user);
  };

  const signUp = async (username: string, email: string, password: string) => {
    await authService.signUp({ username, email, password });
    const user = await authService.getCurrentUser();
    setUser(user);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
