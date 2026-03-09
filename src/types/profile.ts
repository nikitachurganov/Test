export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  phoneNumber: string;
  avatarUrl: string | null;
  createdAt: string;
}

