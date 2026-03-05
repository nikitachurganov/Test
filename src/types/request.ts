import type { FormEntity } from './form';

export interface RequestEntity {
  id: string;
  title: string;
  form_id: string;
  data: Record<string, unknown>;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  form_snapshot?: FormEntity | null;
}

