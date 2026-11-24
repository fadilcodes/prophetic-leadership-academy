begin;

alter policy public_active_programs on public.programs using (true);

alter table public.program_registrations
  add column midtrans_snap_token text,
  add column payment_amount integer check (payment_amount > 0),
  add column payment_expires_at timestamptz,
  add column confirmation_sent_at timestamptz;

-- Preserve the available price for any registrations created before this migration.
update public.program_registrations as registration
set payment_amount = program.price
from public.programs as program
where program.id = registration.program_id
  and registration.midtrans_order_id is not null and program.price > 0;

create index program_registrations_pending_idx
  on public.program_registrations (program_id, payment_expires_at)
  where pay_status = 'PENDING' and midtrans_order_id is not null;

create table public.program_access_details (
  program_id uuid primary key references public.programs(id) on delete cascade,
  details text not null
);
alter table public.program_access_details enable row level security;
revoke all on public.program_access_details from public, anon, authenticated;
grant select, insert, update, delete on public.program_access_details to service_role;

create function public.register_program(
  p_id uuid, p_slug text, p_name text, p_email text, p_phone text, p_institution text
) returns public.program_registrations
language plpgsql
set search_path = ''
as $$
declare
  program public.programs;
  registration public.program_registrations;
begin
  select * into program from public.programs where slug = p_slug for update;
  if not found then
    raise exception using message = 'PROGRAM_NOT_FOUND', errcode = 'P0001';
  end if;

  select * into registration from public.program_registrations where id = p_id;
  if found then
    if registration.program_id <> program.id or registration.participant_name <> p_name
      or registration.email <> p_email or registration.phone_wa <> p_phone
      or registration.institution is distinct from p_institution then
      raise exception using message = 'REGISTRATION_CONFLICT', errcode = 'P0001';
    end if;
    return registration;
  end if;

  if program.status <> 'OPEN' or program.schedule_date <= now() then
    raise exception using message = 'PROGRAM_CLOSED', errcode = 'P0001';
  end if;

  if program.registered_count + (
    select count(*) from public.program_registrations
    where program_id = program.id and pay_status = 'PENDING' and midtrans_order_id is not null
  ) >= program.quota then
    raise exception using message = 'PROGRAM_CAPACITY', errcode = 'P0001';
  end if;

  insert into public.program_registrations (
    id, program_id, participant_name, email, phone_wa, institution, pay_status,
    midtrans_order_id, payment_amount, payment_expires_at
  ) values (
    p_id, program.id, p_name, p_email, p_phone, p_institution,
    case when program.is_paid then 'PENDING'::public.registration_pay_status
      else 'CONFIRMED'::public.registration_pay_status end,
    case when program.is_paid then 'PROG-' || p_id::text end,
    case when program.is_paid then program.price end,
    case when program.is_paid then date_trunc('second', now()) + interval '30 minutes' end
  ) returning * into registration;

  if not program.is_paid then
    update public.programs
    set registered_count = registered_count + 1,
        status = case when registered_count + 1 = quota then 'FULL' else status end
    where id = program.id;
  end if;

  return registration;
end;
$$;

create function public.update_program_payment(
  p_order_id text, p_amount integer, p_status public.registration_pay_status
) returns public.program_registrations
language plpgsql
set search_path = ''
as $$
declare
  registration public.program_registrations;
begin
  select * into registration from public.program_registrations
  where midtrans_order_id = p_order_id for update;

  if not found or registration.payment_amount is distinct from p_amount then
    raise exception using message = 'PAYMENT_MISMATCH', errcode = 'P0001';
  end if;

  if p_status is null or p_status not in ('PAID', 'EXPIRED') then
    raise exception using message = 'INVALID_PAYMENT_STATUS', errcode = 'P0001';
  end if;

  if registration.pay_status <> 'PENDING' then
    return registration;
  end if;

  if p_status = 'PAID' then
    update public.programs
    set registered_count = registered_count + 1,
        status = case when registered_count + 1 = quota and status = 'OPEN' then 'FULL' else status end
    where id = registration.program_id and registered_count < quota;
    if not found then
      raise exception using message = 'PROGRAM_CAPACITY', errcode = 'P0001';
    end if;
  end if;

  update public.program_registrations set pay_status = p_status
  where id = registration.id returning * into registration;
  return registration;
end;
$$;

revoke all on function public.register_program(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_program(uuid, text, text, text, text, text) to service_role;

revoke all on function public.update_program_payment(text, integer, public.registration_pay_status)
  from public, anon, authenticated;
grant execute on function public.update_program_payment(text, integer, public.registration_pay_status) to service_role;

commit;
