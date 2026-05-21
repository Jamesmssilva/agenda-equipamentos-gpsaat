create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.equipment_bookings (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null,
  advisor_name text not null,
  email text not null,
  department text not null,
  equipment_id text not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  purpose text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decision_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

alter table public.admin_users enable row level security;
alter table public.equipment_bookings enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists "Public can create pending booking requests" on public.equipment_bookings;
create policy "Public can create pending booking requests"
on public.equipment_bookings
for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "Public can read approved bookings" on public.equipment_bookings;
create policy "Public can read approved bookings"
on public.equipment_bookings
for select
to anon, authenticated
using (status = 'approved' or public.is_admin());

drop policy if exists "Admins can update bookings" on public.equipment_bookings;
create policy "Admins can update bookings"
on public.equipment_bookings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists equipment_bookings_set_updated_at on public.equipment_bookings;
create trigger equipment_bookings_set_updated_at
before update on public.equipment_bookings
for each row
execute function public.set_updated_at();

-- Depois de criar um usuário em Authentication > Users, copie o UUID dele
-- e rode uma linha como esta, trocando os valores:
-- insert into public.admin_users (user_id, email)
-- values ('UUID_DO_USUARIO_ADMIN', 'admin@ufcat.edu.br');
