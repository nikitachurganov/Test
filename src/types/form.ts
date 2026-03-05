export interface FieldOption {
  id: string;
  label: string;
}

export interface Field {
  id: string;
  label: string;
  type: string;
  options?: FieldOption[];
}

export interface FormEntity {
  id: string;
  title: string;
  fields: Field[];
}

