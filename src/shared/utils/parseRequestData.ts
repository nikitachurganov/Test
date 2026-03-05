export function parseRequestData(
  data: unknown,
): Record<string, unknown> {
  if (data == null) {
    return {};
  }

  let value: unknown = data;

  if (typeof data === 'string') {
    try {
      value = JSON.parse(data);
    } catch {
      return {};
    }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

