import { create } from 'zustand';
import type { FormSchema } from '../types/form-schema.types';

type CreateFormPayload = Omit<FormSchema, 'id' | 'createdAt'>;
type UpdateFormPayload = Partial<Omit<FormSchema, 'id' | 'createdAt'>>;

interface FormsState {
  forms: FormSchema[];
  addForm: (form: CreateFormPayload) => void;
  deleteForm: (id: string) => void;
  updateForm: (id: string, data: UpdateFormPayload) => void;
}

export const useFormsStore = create<FormsState>((set) => ({
  forms: [],
  addForm: (form) =>
    set((state) => ({
      forms: [
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          ...form,
        },
        ...state.forms,
      ],
    })),
  deleteForm: (id) =>
    set((state) => ({
      forms: state.forms.filter((item) => item.id !== id),
    })),
  updateForm: (id, data) =>
    set((state) => ({
      forms: state.forms.map((item) =>
        item.id === id ? { ...item, ...data } : item,
      ),
    })),
}));
