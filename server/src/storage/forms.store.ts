import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Form, CreateFormDto } from '../types/form.types';

// Data file lives at  <server-root>/data/forms.json
// process.cwd() is the server root when npm scripts are run from there.
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'forms.json');

// ── Persistence helpers ───────────────────────────────────────────────────────

const ensureDataDir = (): void => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const loadFromDisk = (): Form[] => {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as Form[];
  } catch {
    console.warn('[store] forms.json could not be parsed — starting with empty store');
    return [];
  }
};

const saveToDisk = (data: Form[]): void => {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

// ── In-memory store (populated from file at startup) ─────────────────────────

let store: Form[] = loadFromDisk();
console.log(`[store] Loaded ${store.length} form(s) from ${DATA_FILE}`);

// ── Public API ────────────────────────────────────────────────────────────────

export const getAllForms = (): Form[] => [...store];

export const createForm = (dto: CreateFormDto): Form => {
  const now = new Date().toISOString();

  const form: Form = {
    id: randomUUID(),
    name: dto.name,
    description: dto.description ?? '',
    fields: dto.fields ?? [],
    created_at: now,
    updated_at: now,
  };

  store.push(form);
  saveToDisk(store);

  return form;
};
