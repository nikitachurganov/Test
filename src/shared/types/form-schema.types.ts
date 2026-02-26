export type FormSchemaFieldType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio';

export interface FormSchemaField {
  id: string;
  label: string;
  type: FormSchemaFieldType;
  placeholder: string;
  required: boolean;
  options?: string[];
}

export interface FormSchemaBlock {
  id: string;
  title: string;
  fields: FormSchemaField[];
}

export interface FormSchema {
  id: string;
  title: string;
  description: string;
  blocks: FormSchemaBlock[];
  createdAt: string;
}
