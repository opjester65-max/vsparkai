-- Vspark Studio PostgreSQL Schema & Storage Bucket Policies for Supabase

create extension if not exists "pgcrypto";

create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('LinkedIn', 'X', 'Instagram', 'Facebook')),
  topic text not null default '',
  caption text not null,
  hashtags text[] not null default '{}',
  media_url text,
  scheduled_at timestamptz not null,
  notify_before_minutes integer not null default 30,
  notify_email boolean not null default true,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Published', 'Draft')),
  engagement_score integer not null default 90,
  tone text not null default 'Professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scheduled_posts_user_scheduled_at
  on public.scheduled_posts (user_id, scheduled_at asc);

alter table public.scheduled_posts enable row level security;

create policy "Users can view own scheduled posts"
  on public.scheduled_posts for select
  using (auth.uid() = user_id);

create policy "Users can insert own scheduled posts"
  on public.scheduled_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scheduled posts"
  on public.scheduled_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own scheduled posts"
  on public.scheduled_posts for delete
  using (auth.uid() = user_id);

-- Storage bucket for post attachments
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

create policy "Public read access for post-media"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "Authenticated users can upload to post-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own post-media objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-media' and auth.uid()::text = (storage.foldername(name))[1]);
