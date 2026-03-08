import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
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

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAuthLoading: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const loadProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    const existingProfile = await getProfileById(nextUser.id);
    setProfile(existingProfile);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        const nextSession = data.session;
        const nextUser = nextSession?.user ?? null;

        if (!isMounted) {
          return;
        }

        setSession(nextSession);
        setUser(nextUser);

        await loadProfile(nextUser);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      void loadProfile(nextUser);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (payload: SignInPayload) => {
    await signInWithEmail(payload);
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    return signUpWithEmail(payload);
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [loadProfile, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      isAuthLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, user, profile, isAuthLoading, signIn, signUp, signOut, refreshProfile],
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

