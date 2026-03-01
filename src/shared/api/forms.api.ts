import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of a single field stored in Supabase (jsonb column) */
export interface CreateFormFieldPayload {
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  /** Labels of selectable options (radio / checkbox / dropdown) */
  options?: string[];
  /** Child fields — only present for group-type fields */
  children?: CreateFormFieldPayload[];
}

/** Body used when inserting a new form */
export interface CreateFormPayload {
  name: string;
  description?: string;
  fields: CreateFormFieldPayload[];
}

/** Row returned from the `forms` table */
export interface FormResponse {
  id: string;
  name: string;
  description: string;
  fields: CreateFormFieldPayload[];
  created_at: string;
  updated_at: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const getForms = async (): Promise<FormResponse[]> => {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as FormResponse[];
};

export const createForm = async (
  payload: CreateFormPayload,
): Promise<FormResponse> => {
  const { data, error } = await supabase
    .from('forms')
    .insert([
      {
        name: payload.name,
        description: payload.description ?? null,
        fields: payload.fields,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FormResponse;
};
