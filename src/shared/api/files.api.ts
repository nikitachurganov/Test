import { supabase } from '../lib/supabase';

const BUCKET = 'form-uploads';

const MAX_FILE_SIZES: Record<string, number> = {
  file_image: 10 * 1024 * 1024,    // 10 MB
  file_vector: 20 * 1024 * 1024,   // 20 MB
  file_document: 20 * 1024 * 1024, // 20 MB
};

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  file_image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  file_vector: [
    'image/svg+xml',
    'application/pdf',
    'application/postscript',           // .ai / .eps
    'application/illustrator',
  ],
  file_document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ],
};

export interface FileMetadata {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
}

function sanitizeFileName(name: string): string {
  // Split into base name and extension
  const lastDot = name.lastIndexOf('.');
  const ext = lastDot !== -1 ? name.slice(lastDot).toLowerCase() : '';
  const base = lastDot !== -1 ? name.slice(0, lastDot) : name;

  const safeBase = base
    .normalize('NFD')                 // decompose accents / Cyrillic variants
    .replace(/[^\x00-\x7F]/g, '_')   // strip all non-ASCII (includes Cyrillic)
    .replace(/[^a-zA-Z0-9_\-]/g, '_') // keep only safe ASCII chars
    .replace(/_{2,}/g, '_')           // collapse repeated underscores
    .replace(/^_+|_+$/g, '')         // trim leading/trailing underscores
    .substring(0, 180);

  return (safeBase || 'file') + ext;
}

function validateFile(file: File, fieldType: string): void {
  const maxSize = MAX_FILE_SIZES[fieldType] ?? 10 * 1024 * 1024;
  if (file.size > maxSize) {
    const mb = Math.round(maxSize / 1024 / 1024);
    throw new Error(`Файл "${file.name}" превышает ${mb} МБ`);
  }

  const allowedTypes = ALLOWED_MIME_TYPES[fieldType];
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new Error(
      `Тип файла "${file.type}" не поддерживается для данного поля`,
    );
  }
}

/**
 * Uploads a single file to Supabase Storage and returns its metadata.
 *
 * Storage path: `{requestId}/{fieldId}/{sanitized_filename}`
 * Each request+field combination gets its own folder for clean isolation.
 */
export async function uploadFile(
  file: File,
  fieldType: string,
  requestId: string,
  fieldId: string,
): Promise<FileMetadata> {
  validateFile(file, fieldType);

  const safeName = sanitizeFileName(file.name);
  const fileId = crypto.randomUUID();
  const storagePath = `${requestId}/${fieldId}/${fileId}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Ошибка загрузки файла "${file.name}": ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return {
    id: fileId,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    file_url: urlData.publicUrl,
  };
}

/**
 * Uploads all files for a given field and returns an array of metadata objects.
 * Accepts the Ant Design Upload `fileList` format.
 */
export async function uploadFieldFiles(
  fileList: Array<{ originFileObj?: File; name?: string }>,
  fieldType: string,
  requestId: string,
  fieldId: string,
): Promise<FileMetadata[]> {
  const results: FileMetadata[] = [];

  for (const entry of fileList) {
    const file = entry.originFileObj;
    if (!file) continue;
    const meta = await uploadFile(file, fieldType, requestId, fieldId);
    results.push(meta);
  }

  return results;
}

/**
 * Deletes all files under a request folder in storage.
 * Call this if a request is deleted and you want to clean up.
 */
export async function deleteRequestFiles(requestId: string): Promise<void> {
  const { data: list, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(requestId, { limit: 1000 });

  if (listError || !list) return;

  const paths = list.map((f) => `${requestId}/${f.name}`);
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
}
