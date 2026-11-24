begin;

alter table public.orders
  add column tracking_updated_at timestamptz,
  add column tracking_email_sent_at timestamptz;

grant select, insert, update, delete on public.program_access_details to authenticated;
create policy admin_program_access_details on public.program_access_details for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create function public.admin_dashboard_metrics()
returns table(program_revenue bigint, merchandise_revenue bigint, processing_orders bigint, registered_participants bigint)
language sql stable security invoker set search_path = ''
as $$
  select
    (select coalesce(sum(coalesce(r.payment_amount, p.price)), 0)
      from public.program_registrations r join public.programs p on p.id = r.program_id where r.pay_status = 'PAID'),
    (select coalesce(sum(o.total_amount), 0) from public.orders o where o.pay_status = 'PAID'),
    (select count(*) from public.orders o where o.fulfillment_status = 'PROCESSING'),
    (select count(*) from public.program_registrations)
  where (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$;

create function public.admin_ship_order(p_order_id uuid, p_tracking_number text)
returns public.orders
language plpgsql security invoker set search_path = ''
as $$
declare
  shipment public.orders;
begin
  if (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if p_tracking_number is null or p_tracking_number !~ '^[A-Za-z0-9][A-Za-z0-9 ._/-]{0,79}$' then
    raise exception 'INVALID_TRACKING_NUMBER' using errcode = '22023';
  end if;

  select * into shipment from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;
  if shipment.pay_status <> 'PAID' or shipment.fulfillment_status not in ('PROCESSING', 'SHIPPED') then
    raise exception 'ORDER_NOT_SHIPPABLE' using errcode = 'P0001';
  end if;

  if shipment.fulfillment_status = 'SHIPPED' and shipment.tracking_number = p_tracking_number
    and shipment.tracking_updated_at is not null then
    return shipment;
  end if;

  update public.orders
  set fulfillment_status = 'SHIPPED', tracking_number = p_tracking_number,
      tracking_updated_at = clock_timestamp(), tracking_email_sent_at = null
  where id = p_order_id returning * into shipment;
  return shipment;
end;
$$;

create function public.check_program_quota()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.quota < old.quota and new.quota < old.registered_count + (
    select count(*) from public.program_registrations
    where program_id = old.id and pay_status = 'PENDING' and midtrans_order_id is not null
  ) then
    raise exception 'PROGRAM_CAPACITY' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger check_program_quota before update of quota on public.programs
for each row execute function public.check_program_quota();

revoke all on function public.admin_dashboard_metrics(), public.admin_ship_order(uuid, text), public.check_program_quota()
  from public, anon, authenticated;
grant execute on function public.admin_dashboard_metrics(), public.admin_ship_order(uuid, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pla-public-media', 'pla-public-media', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy admin_qris_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'pla-public-media' and (storage.foldername(name))[1] = 'qris'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy admin_qris_select on storage.objects for select to authenticated
  using (bucket_id = 'pla-public-media' and (storage.foldername(name))[1] = 'qris'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy admin_qris_delete on storage.objects for delete to authenticated
  using (bucket_id = 'pla-public-media' and (storage.foldername(name))[1] = 'qris'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

commit;
