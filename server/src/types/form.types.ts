/** A single field inside a form definition */
export interface FormField {
  /** Field type: mirrors the frontend field types */
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  /** Applicable to select / radio / checkbox fields */
  options?: string[];
}

/** A stored form */
export interface Form {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  created_at: string;
  updated_at: string;
}

/** Shape of the request body accepted by POST /api/forms */
export interface CreateFormDto {
  name: string;
  description?: string;
  fields?: FormField[];
}
