import { create } from 'zustand';
import type { Request } from '../types/request.types';

type CreateRequestPayload = Omit<Request, 'id' | 'createdAt'>;

interface RequestsState {
  requests: Request[];
  addRequest: (request: CreateRequestPayload) => void;
}

export const useRequestsStore = create<RequestsState>((set) => ({
  requests: [],
  addRequest: (request) =>
    set((state) => ({
      requests: [
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          ...request,
        },
        ...state.requests,
      ],
    })),
}));
