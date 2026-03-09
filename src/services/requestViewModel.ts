import api from '../shared/lib/api';

// ─── Raw API response types (narrow projections) ────────────────────────────

interface RequestRow {
  id: string;
  form_id: string;
  data: unknown;
  form_snapshot?: unknown | null;
}

interface FormRow {
  id: string;
  name: string;
  fields: unknown;
}

// ─── Normalized view model types ───────────────────────────────────────────────

export interface RequestViewFieldOption {
  id: string;
  label: string;
}

export interface RequestViewField {
  id: string;
  type: string;
  label: string;
  options: RequestViewFieldOption[];
  value: string | string[] | null;
  rawValue: unknown;
}

export interface RequestViewModel {
  requestId: string;
  formId: string;
  formTitle: string;
  fields: RequestViewField[];
  missingFields: string[];
  orphanValues: string[];
}

// ─── Helper types for raw structure traversal ──────────────────────────────────

interface RawField {
  id?: string;
  label?: string;
  type?: string;
  options?: unknown;
  children?: RawField[];
}

interface RawPage {
  id?: string;
  title?: string;
  fields?: RawField[];
}

interface RawStructure {
  id?: string;
  title?: string;
  fields?: RawField[];
  pages?: RawPage[];
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

const READABLE_DELETED_OPTION = '[DELETED OPTION]';

const parseValues = (data: unknown): Record<string, unknown> => {
  if (data == null) return {};
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return {};
};

const normalizeOptions = (raw: unknown): RequestViewFieldOption[] => {
  if (!Array.isArray(raw)) return [];
  const result: RequestViewFieldOption[] = [];

  for (const item of raw) {
    if (item && typeof item === 'object') {
      const opt = item as { id?: string; label?: string };
      const id = typeof opt.id === 'string' && opt.id.trim() ? opt.id : '';
      const label = typeof opt.label === 'string' && opt.label.trim() ? opt.label : '';
      if (id && label) {
        result.push({ id, label });
      }
    } else if (typeof item === 'string' && item.trim()) {
      const label = item.trim();
      result.push({ id: label, label });
    }
  }

  return result;
};

const collectFieldsFromStructure = (structure: RawStructure): { pages: RawPage[]; fields: RawField[] } => {
  const pages: RawPage[] = [];

  if (Array.isArray(structure.pages) && structure.pages.length > 0) {
    for (const page of structure.pages) {
      if (page && Array.isArray(page.fields)) {
        pages.push(page);
      }
    }
  } else if (Array.isArray(structure.fields)) {
    pages.push({
      id: structure.id,
      title: structure.title,
      fields: structure.fields,
    });
  }

  const allFields: RawField[] = [];

  const walk = (fields: RawField[]) => {
    for (const field of fields) {
      if (!field) continue;
      allFields.push(field);
      if (Array.isArray(field.children) && field.children.length > 0) {
        walk(field.children);
      }
    }
  };

  for (const page of pages) {
    if (Array.isArray(page.fields)) {
      walk(page.fields);
    }
  }

  return { pages, fields: allFields };
};

const resolveValue = (
  field: RequestViewField,
  rawValue: unknown,
): string | string[] | null => {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return null;
  }

  const type = field.type;

  if (type === 'checkbox') {
    const ids = Array.isArray(rawValue) ? rawValue : [];
    const labels = ids
      .map((id) => {
        const idStr = typeof id === 'string' ? id : String(id);
        const matched = field.options.find((opt) => opt.id === idStr);
        return matched?.label ?? null;
      })
      .filter((v): v is string => Boolean(v));

    if (!labels.length && ids.length > 0) {
      return [READABLE_DELETED_OPTION];
    }

    return labels.length ? labels : null;
  }

  if (type === 'radio' || type === 'dropdown' || type === 'select') {
    const valueId = typeof rawValue === 'string' ? rawValue : String(rawValue);
    const matched = field.options.find((opt) => opt.id === valueId);
    if (!matched) {
      return READABLE_DELETED_OPTION;
    }
    return matched.label;
  }

  if (type === 'file_image' || type === 'file_vector' || type === 'file_document') {
    return typeof rawValue === 'string' ? rawValue : String(rawValue);
  }

  if (
    type === 'text' ||
    type === 'shortText' ||
    type === 'longText' ||
    type === 'email' ||
    type === 'address' ||
    type === 'fullName' ||
    type === 'number' ||
    type === 'phone'
  ) {
    return typeof rawValue === 'string' || typeof rawValue === 'number'
      ? String(rawValue)
      : null;
  }

  return typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue);
};

// ─── Public API ────────────────────────────────────────────────────────────────

export async function getRequestViewModel(requestId: string): Promise<RequestViewModel> {
  const { data: requestRow } = await api.get<RequestRow>(`/requests/${requestId}`);

  let structure: RawStructure | null = null;
  let formTitle = '';

  if (requestRow.form_snapshot) {
    structure = requestRow.form_snapshot as RawStructure;
    formTitle = structure.title ?? '';
  } else {
    const { data: formRow } = await api.get<FormRow>(`/forms/${requestRow.form_id}`);

    // The API returns `pages` in the response; map it to the fields-based
    // structure the view-model parser expects.
    const apiResponse = formRow as any;
    const rawFields = apiResponse.pages ?? apiResponse.fields ?? {};

    structure = rawFields as RawStructure;
    formTitle = (structure as any).title ?? formRow.name ?? '';
  }

  if (!structure) {
    throw new Error('Form structure is missing');
  }

  const { fields: rawFields } = collectFieldsFromStructure(structure);
  const values = parseValues(requestRow.data);

  const fields: RequestViewField[] = [];
  const missingFields: string[] = [];

  for (const rawField of rawFields) {
    const id = rawField.id;
    const label = rawField.label?.trim();
    const type = rawField.type ?? '';

    if (!id || !label) {
      continue;
    }

    const options = normalizeOptions(rawField.options);
    const rawValue = values[id];
    const value = resolveValue(
      {
        id,
        type,
        label,
        options,
        value: null,
        rawValue: undefined,
      },
      rawValue,
    );

    if (rawValue === undefined) {
      missingFields.push(id);
    }

    fields.push({
      id,
      type,
      label,
      options,
      value,
      rawValue,
    });
  }

  const knownIds = new Set(rawFields.map((f) => f.id).filter(Boolean) as string[]);
  const orphanValues = Object.keys(values).filter((key) => !knownIds.has(key));

  return {
    requestId: requestRow.id,
    formId: requestRow.form_id,
    formTitle,
    fields,
    missingFields,
    orphanValues,
  };
}
