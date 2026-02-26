import type { FormFieldInstance } from '../types/form-builder.types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

export interface FormTemplate {
  id: string;
  name: string;
  schema: { fields: FormFieldInstance[] };
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  schema: { fields: FormFieldInstance[] };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const templatesApi = {
  list: () => request<FormTemplate[]>('/api/templates'),

  create: (payload: CreateTemplatePayload) =>
    request<FormTemplate>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
