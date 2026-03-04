import { supabase } from '../lib/supabase';

export type RequestStatus = 'open' | 'closed';

export interface RequestResponse {
  id: string;
  title: string;
  form_id: string;
  data: unknown;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

interface DbRequestRow {
  id: string;
  title: string;
  form_id: string;
  data: unknown;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateRequestPayload {
  title: string;
  form_id: string;
  data: unknown;
  status?: RequestStatus;
}

export interface UpdateRequestPayload {
  title?: string;
  status?: RequestStatus;
  data?: unknown;
}

const mapRow = (row: DbRequestRow): RequestResponse => ({
  id: row.id,
  title: row.title,
  form_id: row.form_id,
  data: row.data,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const getRequests = async (): Promise<RequestResponse[]> => {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as DbRequestRow[];
  return rows.map(mapRow);
};

export const getRequestById = async (id: string): Promise<RequestResponse> => {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as DbRequestRow);
};

export const createRequest = async (
  payload: CreateRequestPayload,
): Promise<RequestResponse> => {
  const { data, error } = await supabase
    .from('requests')
    .insert([
      {
        title: payload.title,
        form_id: payload.form_id,
        data: payload.data,
        status: payload.status ?? 'open',
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as DbRequestRow);
};

export const updateRequest = async (
  id: string,
  payload: UpdateRequestPayload,
): Promise<RequestResponse> => {
  const { data, error } = await supabase
    .from('requests')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as DbRequestRow);
};

export const deleteRequest = async (id: string): Promise<void> => {
  const { error } = await supabase.from('requests').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

