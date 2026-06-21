-- Growth Sphere — users table
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query)

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text not null unique,
  dob           date,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- speeds up login lookups by email
create index if not exists idx_users_email on users (email);
