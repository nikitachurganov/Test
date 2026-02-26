/** Backend base URL — set VITE_API_URL in .env to override */
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

// ─── Request / Response types ────────────────────────────────────────────────

/** Shape of a single field as the backend expects it */
export interface CreateFormFieldPayload {
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  /** Labels of selectable options (for radio / checkbox / dropdown) */
  options?: string[];
  /** Child fields — only present for group-type fields */
  children?: CreateFormFieldPayload[];
}

/** Body for POST /api/forms */
export interface CreateFormPayload {
  name: string;
  description?: string;
  fields: CreateFormFieldPayload[];
}

/** Shape returned by the server after creating a form */
export interface FormResponse {
  id: string;
  name: string;
  description: string;
  fields: CreateFormFieldPayload[];
  created_at: string;
  updated_at: string;
}

// ─── Core fetch helper ───────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    // Try to surface the server's own error message
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const getForms = (): Promise<FormResponse[]> =>
  request<FormResponse[]>('/api/forms');

export const createForm = (payload: CreateFormPayload): Promise<FormResponse> =>
  request<FormResponse>('/api/forms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
