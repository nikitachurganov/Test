alter table if exists public.requests
add column if not exists closed_at timestamptz null;

