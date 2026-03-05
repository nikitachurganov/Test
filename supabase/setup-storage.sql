-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create the storage bucket for form file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'form-uploads',
  'form-uploads',
  true, -- public read access for preview URLs
  20971520, -- 20 MB global limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/postscript',
    'application/illustrator',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to upload files (anon key)
CREATE POLICY "Allow public uploads"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'form-uploads');

-- 3. Allow anyone to read/download files (public bucket)
CREATE POLICY "Allow public reads"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'form-uploads');

-- 4. Allow deletion by anyone (for cleanup)
CREATE POLICY "Allow public deletes"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'form-uploads');

-- 5. (Optional) Metadata table for queryable file records
--    The primary storage of file metadata is inside requests.data jsonb,
--    but this table enables querying files independently.
CREATE TABLE IF NOT EXISTS public.form_files (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  integer NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  field_id    text NOT NULL,
  file_name   text NOT NULL,
  file_type   text NOT NULL,
  file_size   integer NOT NULL DEFAULT 0,
  file_url    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_files_request
  ON public.form_files (request_id);

-- RLS for form_files
ALTER TABLE public.form_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon on form_files"
  ON public.form_files FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
