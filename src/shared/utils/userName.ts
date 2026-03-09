export interface DisplayNameSource {
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  full_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  fullName?: string | null;
}

export function buildDisplayName(user: DisplayNameSource): string {
  const lastName = (user.last_name ?? user.lastName ?? '').trim();
  const firstName = (user.first_name ?? user.firstName ?? '').trim();
  const middleName = (user.middle_name ?? user.middleName ?? '').trim();

  const parts = [lastName, firstName, middleName].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ');
  }

  return (user.full_name ?? user.fullName ?? '').trim() || 'Пользователь';
}