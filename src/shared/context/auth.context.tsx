import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  signInWithEmail,
  signOut as signOutRequest,
  signUpWithEmail,
  type SignInPayload,
  type SignUpResult,
  type SignUpPayload,
} from '../api/auth.api';
import { getProfileById } from '../api/profiles.api';
import type { UserProfile } from '../../types/profile';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAuthLoading: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      const p = await getProfileById('me');
      if (p) {
        setUser({ id: p.id, email: p.email });
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('access_token');
      }
    } catch {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('access_token');
    }
  }, []);

  useEffect(() => {
    void loadProfile().finally(() => setIsAuthLoading(false));
  }, [loadProfile]);

  const signIn = useCallback(
    async (payload: SignInPayload) => {
      await signInWithEmail(payload);
      await loadProfile();
    },
    [loadProfile],
  );

  const signUp = useCallback(
    async (payload: SignUpPayload) => {
      const result = await signUpWithEmail(payload);
      await loadProfile();
      return result;
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAuthLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, profile, isAuthLoading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
};
