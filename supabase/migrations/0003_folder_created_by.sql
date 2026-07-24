-- Tracks who created each folder/subfolder (files already have uploaded_by).
-- Nullable and additive: existing folders simply have no recorded creator.
alter table public.folders
  add column if not exists created_by uuid references auth.users(id) on delete set null;
