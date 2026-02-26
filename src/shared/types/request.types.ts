export type RequestStatus = 'new' | 'in_progress' | 'done';

export interface Request {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
}
