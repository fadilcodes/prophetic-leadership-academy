begin;

alter table public.products add column material text;

alter table public.orders
  add column checkout_fingerprint text,
  add column payment_expires_at timestamptz,
  add column payment_started_at timestamptz,
  add column midtrans_snap_token text,
  add column confirmation_sent_at timestamptz;

create index orders_pending_expiry_idx on public.orders (payment_expires_at)
  where pay_status = 'PENDING' and payment_expires_at is not null;

-- The previous overload remains available to existing server callers.
create function public.create_merchandise_order(
  p_order_number text,
  p_customer_name text,
  p_customer_email text,
  p_phone_wa text,
  p_province text,
  p_city text,
  p_district text,
  p_postal_code text,
  p_full_address text,
  p_courier_name text,
  p_courier_service text,
  p_shipping_cost integer,
  p_items jsonb,
  p_expected_subtotal integer,
  p_weight_gram integer,
  p_checkout_fingerprint text
)
returns public.orders
language plpgsql
set search_path = ''
as $$
declare
  merchant_order public.orders;
  current_subtotal bigint;
  current_weight bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_order_number, 0));
  select * into merchant_order from public.orders where order_number = p_order_number;
  if found then
    if merchant_order.checkout_fingerprint is distinct from p_checkout_fingerprint then
      raise exception 'CHECKOUT_CONFLICT' using errcode = 'P0001';
    end if;
    return merchant_order;
  end if;

  -- Lock in the same order as the stock reservation and restoration RPCs.
  perform product.id from public.products as product
  where product.id in (select item.product_id from jsonb_to_recordset(p_items) as item(product_id uuid))
  order by product.id for update;

  select sum(product.price::bigint * item.qty), sum(product.weight_gram::bigint * item.qty)
    into current_subtotal, current_weight
  from jsonb_to_recordset(p_items) as item(product_id uuid, qty integer)
  join public.products as product on product.id = item.product_id and product.is_active;

  if current_subtotal is distinct from p_expected_subtotal::bigint
    or current_weight is distinct from p_weight_gram::bigint then
    raise exception 'CHECKOUT_CHANGED' using errcode = 'P0001';
  end if;

  merchant_order := public.create_merchandise_order(
    p_order_number, p_customer_name, p_customer_email, p_phone_wa, p_province, p_city,
    p_district, p_postal_code, p_full_address, p_courier_name, p_courier_service, p_shipping_cost, p_items
  );

  update public.orders set
    checkout_fingerprint = p_checkout_fingerprint,
    midtrans_order_id = 'ORD-' || p_order_number,
    payment_expires_at = date_trunc('second', now()) + interval '30 minutes'
  where id = merchant_order.id returning * into merchant_order;
  return merchant_order;
end;
$$;

create function public.release_unpublished_order(p_order_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform id from public.orders
  where id = p_order_id and pay_status = 'PENDING' and midtrans_redirect_url is null
  for update;
  if not found then
    return false;
  end if;
  return public.restore_order_stock(p_order_id);
end;
$$;

revoke all on function public.create_merchandise_order(
  text, text, text, text, text, text, text, text, text, text, text, integer, jsonb, integer, integer, text
) from public, anon, authenticated;
grant execute on function public.create_merchandise_order(
  text, text, text, text, text, text, text, text, text, text, text, integer, jsonb, integer, integer, text
) to service_role;

revoke all on function public.release_unpublished_order(uuid) from public, anon, authenticated;
grant execute on function public.release_unpublished_order(uuid) to service_role;

commit;
