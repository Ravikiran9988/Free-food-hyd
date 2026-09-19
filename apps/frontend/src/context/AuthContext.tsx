import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getMe, type User } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('ffh_token');
      // Ignore string literals that might have been accidentally saved
      if (token && token !== 'undefined' && token !== 'null') {
        const userData = await getMe();
        setUser(userData);
      } else {
        // Clear any invalid string tokens immediately without noisy errors
        if (token === 'undefined' || token === 'null') {
          localStorage.removeItem('ffh_token');
        }
        setUser(null);
      }
    } catch (error: any) {
      // Only log if it's a real unexpected error, ignore normal "Not authenticated" 401s from expired tokens
      if (error?.message !== 'Not authenticated') {
        console.error("Auth initialization failed", error);
      }
      localStorage.removeItem('ffh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('ffh_token', token);
    setIsLoading(true);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('ffh_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
