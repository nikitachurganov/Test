import { supabase } from '../lib/supabase';

export type RequestStatus = 'open' | 'closed';

export interface RequestResponse {
  id: string;
  title: string;
  form_id: string;
  data: unknown;
  status: RequestStatus;
  closedAt: string | null;
  created_at: string;
  updated_at: string;
  form_snapshot?: unknown | null;
}

interface DbRequestRow {
  id: string;
  title: string;
  form_id: string;
  data: unknown;
  status: RequestStatus;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  form_snapshot?: unknown | null;
}

export interface CreateRequestPayload {
  title: string;
  form_id: string;
  data: unknown;
  status?: RequestStatus;
  form_snapshot?: unknown;
}

export interface UpdateRequestPayload {
  title?: string;
  status?: RequestStatus;
  closedAt?: string | null;
  data?: unknown;
}

const mapRow = (row: DbRequestRow): RequestResponse => ({
  id: row.id,
  title: row.title,
  form_id: row.form_id,
  data: row.data,
  status: row.status,
  closedAt: row.closed_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
  form_snapshot: row.form_snapshot ?? null,
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
        form_snapshot: payload.form_snapshot ?? null,
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
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) updatePayload.title = payload.title;
  if (payload.status !== undefined) updatePayload.status = payload.status;
  if (payload.data !== undefined) updatePayload.data = payload.data;
  if (payload.closedAt !== undefined) updatePayload.closed_at = payload.closedAt;

  const { data, error } = await supabase
    .from('requests')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as DbRequestRow);
};

export const closeRequest = async (id: string): Promise<RequestResponse> => {
  return updateRequest(id, {
    status: 'closed',
    closedAt: new Date().toISOString(),
  });
};

export const deleteRequest = async (id: string): Promise<void> => {
  const { error } = await supabase.from('requests').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

