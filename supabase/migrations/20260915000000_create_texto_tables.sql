create table if not exists texto_textes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titre text not null default 'Sans titre',
  texte text not null,
  sujet text not null,
  contexte text,
  niveau_cible text not null,
  correspondances_connues jsonb not null default '[]'::jsonb,
  score_dechiffrable integer,
  created_at timestamptz not null default now()
);

alter table texto_textes enable row level security;

create policy "texto_textes_owner_select" on texto_textes
  for select using (auth.uid() = user_id);
create policy "texto_textes_owner_insert" on texto_textes
  for insert with check (auth.uid() = user_id);
create policy "texto_textes_owner_delete" on texto_textes
  for delete using (auth.uid() = user_id);

create table if not exists texto_mots_connus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  mots text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table texto_mots_connus enable row level security;

create policy "texto_mots_connus_owner_select" on texto_mots_connus
  for select using (auth.uid() = user_id);
create policy "texto_mots_connus_owner_insert" on texto_mots_connus
  for insert with check (auth.uid() = user_id);
create policy "texto_mots_connus_owner_update" on texto_mots_connus
  for update using (auth.uid() = user_id);

create table if not exists texto_correspondances_connues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  rangs integer[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table texto_correspondances_connues enable row level security;

create policy "texto_correspondances_connues_owner_select" on texto_correspondances_connues
  for select using (auth.uid() = user_id);
create policy "texto_correspondances_connues_owner_insert" on texto_correspondances_connues
  for insert with check (auth.uid() = user_id);
create policy "texto_correspondances_connues_owner_update" on texto_correspondances_connues
  for update using (auth.uid() = user_id);
