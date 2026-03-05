import { supabase } from '../lib/supabase';
import type {
  FieldOption,
  FormFieldInstance,
  FormFieldType,
  FormPageInstance,
} from '../types/form-builder.types';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of a single field stored inside a page (jsonb column) */
export interface CreateFormFieldPayload {
  /** Stable field ID persisted in JSON. Optional for legacy data. */
  id?: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  /**
   * Options for radio / checkbox / dropdown.
   * New shape: array of { id, label } objects to keep option IDs stable.
   * Legacy shape: array of plain label strings.
   */
  options?: Array<string | { id: string; label: string }>;
  /** Child fields — only present for group-type fields */
  children?: CreateFormFieldPayload[];
}

/** Single page (step) stored in Supabase JSON column */
export interface CreateFormPagePayload {
  id: string;
  title: string;
  fields: CreateFormFieldPayload[];
}

/** Body used when inserting a new form */
export interface CreateFormPayload {
  name: string;
  description?: string;
  pages: CreateFormPagePayload[];
}

/** Body used when updating an existing form */
export interface UpdateFormPayload {
  name: string;
  description?: string;
  pages: CreateFormPagePayload[];
}

/** Normalized form shape used across the app */
export interface FormResponse {
  id: string;
  name: string;
  description: string;
  pages: CreateFormPagePayload[];
  created_at: string;
  updated_at: string;
}

/** Raw row returned from the `forms` table */
interface DbFormRow {
  id: string;
  name: string;
  description: string | null;
  fields: unknown;
  created_at: string;
  updated_at: string;
}

// ─── Field converters ─────────────────────────────────────────────────────────

/**
 * Recursively maps a list of FormFieldInstance objects to the flat payload
 * shape the API / Supabase column expects (used inside pages).
 */
export const mapFieldsToPayload = (
  instances: FormFieldInstance[],
): CreateFormFieldPayload[] =>
  instances.map((inst) => ({
    id: inst.id,
    type: inst.type,
    label: inst.label,
    // `description` is the field's hint text — stored as `placeholder` in the API
    placeholder: inst.description || undefined,
    required: inst.required,
    // Persist option IDs + labels so they remain stable across reloads
    options: inst.options?.map((opt) => ({ id: opt.id, label: opt.label })),
    // Recursively include children for group-type fields
    children:
      inst.type === 'group' && inst.children?.length
        ? mapFieldsToPayload(inst.children)
        : undefined,
  }));

/**
 * Reverses mapFieldsToPayload — converts stored payload back to
 * FormFieldInstance so the builder / preview can render it.
 *
 * Important for stability:
 * - Uses the ID stored in JSON when present
 * - Only generates a new ID for truly legacy records that don't have one
 */
export function payloadToInstance(
  payload: CreateFormFieldPayload,
): FormFieldInstance {
  const rawType = payload.type;
  const normalizedType =
    rawType === 'fileUpload' || rawType === 'file'
      ? 'file_document'
      : (rawType as FormFieldType);

  const fieldId =
    typeof payload.id === 'string' && payload.id.trim()
      ? payload.id
      : crypto.randomUUID(); // legacy fallback

  const options: FieldOption[] | undefined = payload.options
    ? payload.options.map((opt) => {
        if (typeof opt === 'string') {
          // Legacy shape: only label was stored
          return {
            id: crypto.randomUUID(),
            label: opt,
          };
        }
        return {
          id:
            typeof opt.id === 'string' && opt.id.trim()
              ? opt.id
              : crypto.randomUUID(),
          label: opt.label,
        };
      })
    : undefined;

  return {
    id: fieldId,
    type: normalizedType as FormFieldType,
    label: payload.label,
    description: payload.placeholder ?? '',
    required: payload.required,
    options,
    children: payload.children?.map(payloadToInstance),
  };
}

/**
 * Maps the in-app page tree to the API payload structure.
 */
export const mapPagesToPayload = (
  pages: FormPageInstance[],
): CreateFormPagePayload[] =>
  pages.map((page, index) => ({
    id: page.id,
    title: page.title || `Страница ${index + 1}`,
    fields: mapFieldsToPayload(page.fields),
  }));

/**
 * Normalizes raw `fields` JSON from Supabase into a pages array.
 * Backward compatibility: if `fields` is a flat array of field payloads,
 * wraps them into a single default page.
 */
const normalizePagesFromDb = (rawFields: unknown): CreateFormPagePayload[] => {
  const arr = Array.isArray(rawFields) ? rawFields : [];
  if (arr.length === 0) {
    return [];
  }

  const first = arr[0] as any;

  // New shape: pages already stored
  if (first && typeof first === 'object' && 'fields' in first) {
    return (arr as any[]).map((page, index) => ({
      id: typeof page.id === 'string' ? page.id : crypto.randomUUID(),
      title:
        typeof page.title === 'string' && page.title.trim()
          ? page.title
          : `Страница ${index + 1}`,
      fields: Array.isArray(page.fields) ? page.fields : [],
    }));
  }

  // Legacy shape: flat field array — wrap into a single page
  return [
    {
      id: crypto.randomUUID(),
      title: 'Страница 1',
      fields: arr as CreateFormFieldPayload[],
    },
  ];
};

/**
 * Converts stored page payloads back to in-app FormPageInstance objects.
 */
export const pagesPayloadToInstances = (
  pages: CreateFormPagePayload[],
): FormPageInstance[] =>
  pages.map((page, index) => ({
    id: page.id || crypto.randomUUID(),
    title: page.title || `Страница ${index + 1}`,
    fields: (page.fields ?? []).map(payloadToInstance),
  }));

// ─── API ──────────────────────────────────────────────────────────────────────

export const getForms = async (): Promise<FormResponse[]> => {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as DbFormRow[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    pages: normalizePagesFromDb(row.fields),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
};

export const getFormById = async (id: string): Promise<FormResponse> => {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  const row = data as DbFormRow;
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    pages: normalizePagesFromDb(row.fields),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
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
        // Persist pages array in the `fields` jsonb column for backward compatibility
        fields: payload.pages,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  const row = data as DbFormRow;
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    pages: normalizePagesFromDb(row.fields),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
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
      // Persist pages array in the `fields` jsonb column for backward compatibility
      fields: payload.pages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const row = data as DbFormRow;
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    pages: normalizePagesFromDb(row.fields),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export const deleteForm = async (id: string): Promise<void> => {
  const { error } = await supabase.from('forms').delete().eq('id', id);
  if (error) throw new Error(error.message);
};
