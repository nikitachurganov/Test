import type { FormEntity } from '../../types/form';

/**
 * Aligns raw form values with a specific form snapshot.
 * Filters out keys that don't exist in the snapshot so that
 * request.data always matches snapshot field IDs.
 */
export function mapDataToSnapshot(
  data: Record<string, unknown>,
  snapshot: FormEntity,
): Record<string, unknown> {
  const validIds = new Set(snapshot.fields.map((f) => f.id));
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (validIds.has(key)) {
      result[key] = value;
    }
  }

  return result;
}

