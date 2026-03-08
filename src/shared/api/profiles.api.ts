import { supabase } from '../lib/supabase';
import type { UserProfile } from '../../types/profile';

interface DbProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  avatar_url: string | null;
  created_at: string;
}

export interface UpsertProfilePayload {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string | null;
}

const mapProfile = (row: DbProfileRow): UserProfile => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phoneNumber: row.phone_number,
  avatarUrl: row.avatar_url,
  createdAt: row.created_at,
});

export const getProfileById = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapProfile(data as DbProfileRow);
};

export const upsertProfile = async (
  payload: UpsertProfilePayload,
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: payload.id,
        full_name: payload.fullName,
        email: payload.email,
        phone_number: payload.phoneNumber,
        avatar_url: payload.avatarUrl ?? null,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapProfile(data as DbProfileRow);
};

