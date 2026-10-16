-- MRecipes Supabase schema (Free Tier compatible)
-- Run in Supabase SQL Editor. Do not put a service_role/secret key in this public site.

create extension if not exists pgcrypto;

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  excerpt text not null default '',
  category text not null default 'Everyday',
  image_url text,
  prep_minutes integer not null default 0 check (prep_minutes >= 0),
  cook_minutes integer not null default 0 check (cook_minutes >= 0),
  servings integer not null default 4 check (servings > 0),
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.recipe_comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  body text not null check (char_length(body) between 5 and 2000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.recipes enable row level security;
alter table public.recipe_comments enable row level security;

drop policy if exists "Anyone can read published recipes" on public.recipes;
create policy "Anyone can read published recipes"
  on public.recipes for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Authenticated authors can create recipes" on public.recipes;
create policy "Authenticated authors can create recipes"
  on public.recipes for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Authors can update their own recipes" on public.recipes;
create policy "Authors can update their own recipes"
  on public.recipes for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "Anyone can read approved comments" on public.recipe_comments;
create policy "Anyone can read approved comments"
  on public.recipe_comments for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "Visitors can submit pending comments" on public.recipe_comments;
create policy "Visitors can submit pending comments"
  on public.recipe_comments for insert
  to anon, authenticated
  with check (status = 'pending');

create index if not exists recipes_published_at_idx
  on public.recipes (published_at desc)
  where status = 'published';
create index if not exists recipe_comments_approved_idx
  on public.recipe_comments (recipe_id, created_at desc)
  where status = 'approved';

-- Intentionally no public update/delete policies for comments or recipes.
-- Manage/moderate content from the Supabase dashboard or a future authenticated admin UI.
