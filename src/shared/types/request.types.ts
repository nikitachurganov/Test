export type RequestStatus = 'open' | 'closed';

export interface Request {
  id: string;
  title: string;
  formId: string;
  data: unknown;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}
