import api from '../lib/api';
import type { UserProfile } from '../../types/profile';

interface MeResponse {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string | null;
  createdAt: string;
}

export const getProfileById = async (
  _userId: string,
): Promise<UserProfile | null> => {
  try {
    const { data } = await api.get<MeResponse>('/auth/me');
    return {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      avatarUrl: data.avatarUrl,
      createdAt: data.createdAt,
    };
  } catch {
    return null;
  }
};

export interface UpsertProfilePayload {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string;
  phoneNumber: string;
  avatarUrl?: string | null;
}

export const upsertProfile = async (
  payload: UpsertProfilePayload,
): Promise<UserProfile> => {
  // Profile updates are handled via the user's own record.
  // For now, return the current profile via /auth/me.
  const profile = await getProfileById(payload.id);
  if (!profile) {
    throw new Error('Failed to load profile');
  }
  return profile;
};
