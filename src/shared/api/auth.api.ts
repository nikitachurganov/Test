import { supabase } from '../lib/supabase';

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface SignUpResult {
  requiresEmailConfirmation: boolean;
}

const getAppBaseUrl = (): string => {
  const configured = import.meta.env.VITE_APP_URL as string | undefined;
  if (configured && configured.trim()) {
    return configured.replace(/\/+$/, '');
  }
  return window.location.origin;
};

export const signInWithEmail = async ({
  email,
  password,
}: SignInPayload): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const signUpWithEmail = async ({
  fullName,
  email,
  phoneNumber,
  password,
}: SignUpPayload): Promise<SignUpResult> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppBaseUrl()}/auth`,
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    requiresEmailConfirmation: !data.session,
  };
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppBaseUrl()}/auth/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const updatePassword = async (password: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw new Error(error.message);
  }
};

