import { supabase } from '../lib/supabase';
import type {
  FieldOption,
  FormFieldInstance,
  FormFieldType,
} from '../types/form-builder.types';

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

/** Body used when updating an existing form */
export interface UpdateFormPayload {
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

// ─── Field converters ─────────────────────────────────────────────────────────

/**
 * Recursively maps the canvas FormFieldInstance tree to the flat payload
 * shape the API / Supabase column expects.
 */
export const mapFieldsToPayload = (
  instances: FormFieldInstance[],
): CreateFormFieldPayload[] =>
  instances.map((inst) => ({
    type: inst.type,
    label: inst.label,
    // `description` is the field's hint text — stored as `placeholder` in the API
    placeholder: inst.description || undefined,
    required: inst.required,
    // Convert FieldOption objects to plain label strings
    options: inst.options?.map((opt) => opt.label),
    // Recursively include children for group-type fields
    children:
      inst.type === 'group' && inst.children?.length
        ? mapFieldsToPayload(inst.children)
        : undefined,
  }));

/**
 * Reverses mapFieldsToPayload — converts stored payload back to
 * FormFieldInstance so the builder / preview can render it.
 * IDs are generated fresh via crypto.randomUUID(); they will be stable
 * for the lifetime of the component that calls this inside useMemo.
 */
export function payloadToInstance(
  payload: CreateFormFieldPayload,
): FormFieldInstance {
  return {
    id: crypto.randomUUID(),
    type: payload.type as FormFieldType,
    label: payload.label,
    description: payload.placeholder ?? '',
    required: payload.required,
    options: payload.options?.map((label): FieldOption => ({
      id: crypto.randomUUID(),
      label,
    })),
    children: payload.children?.map(payloadToInstance),
  };
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

export const getFormById = async (id: string): Promise<FormResponse> => {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as FormResponse;
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

export const updateForm = async (
  id: string,
  payload: UpdateFormPayload,
): Promise<FormResponse> => {
  const { data, error } = await supabase
    .from('forms')
    .update({
      name: payload.name,
      description: payload.description ?? null,
      fields: payload.fields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FormResponse;
};

export const deleteForm = async (id: string): Promise<void> => {
  const { error } = await supabase.from('forms').delete().eq('id', id);
  if (error) throw new Error(error.message);
};
