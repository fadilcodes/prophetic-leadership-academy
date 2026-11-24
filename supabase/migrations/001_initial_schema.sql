begin;

create type public.program_category as enum ('Pelatihan', 'Kajian', 'Pendampingan');
create type public.program_mode as enum ('Online', 'Offline');
create type public.program_status as enum ('OPEN', 'FULL', 'COMPLETED');
create type public.registration_pay_status as enum ('PENDING', 'CONFIRMED', 'PAID', 'EXPIRED');
create type public.order_pay_status as enum ('PENDING', 'PAID', 'EXPIRED');
create type public.order_fulfillment_status as enum ('UNFULFILLED', 'PROCESSING', 'SHIPPED', 'COMPLETED');

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.article_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.article_categories(id),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  thumbnail_url text,
  content text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (not is_published or published_at is not null)
);

create table public.ustadz_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  photo_url text,
  bio text not null,
  expertise_tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  ustadz_id uuid references public.ustadz_profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  category public.program_category not null,
  mode public.program_mode not null,
  is_paid boolean not null default false,
  price integer not null default 0 check (price >= 0),
  quota integer not null check (quota > 0),
  registered_count integer not null default 0 check (registered_count between 0 and quota),
  schedule_date timestamptz not null,
  location_or_platform text not null,
  description text not null,
  syllabus jsonb not null default '[]',
  status public.program_status not null default 'OPEN',
  poster_url text,
  created_at timestamptz not null default now(),
  check (is_paid = (price > 0))
);

create table public.program_registrations (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id),
  participant_name text not null,
  email text not null,
  phone_wa text not null,
  institution text,
  pay_status public.registration_pay_status not null default 'PENDING',
  midtrans_order_id text unique,
  midtrans_redirect_url text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  price integer not null check (price >= 0),
  weight_gram integer not null check (weight_gram > 0),
  stock integer not null check (stock >= 0),
  variants text[] not null default '{}',
  images_url text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  phone_wa text not null,
  province text not null,
  city text not null,
  district text not null,
  postal_code text not null,
  full_address text not null,
  courier_name text not null,
  courier_service text not null,
  shipping_cost integer not null check (shipping_cost >= 0),
  subtotal integer not null check (subtotal >= 0),
  total_amount integer not null check (total_amount = subtotal + shipping_cost),
  pay_status public.order_pay_status not null default 'PENDING',
  fulfillment_status public.order_fulfillment_status not null default 'UNFULFILLED',
  tracking_number text,
  midtrans_order_id text unique,
  midtrans_redirect_url text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  variant text,
  qty integer not null check (qty > 0),
  unit_price integer not null check (unit_price >= 0)
);

create index articles_category_id_idx on public.articles (category_id);
create index programs_ustadz_id_idx on public.programs (ustadz_id);
create index program_registrations_program_id_idx on public.program_registrations (program_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

create function public.set_site_setting_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_site_setting_updated_at() from public, anon, authenticated, service_role;

create trigger site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_site_setting_updated_at();

-- Supabase Auth menetapkan app_metadata.role melalui operasi admin tepercaya.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'site_settings', 'article_categories', 'articles', 'ustadz_profiles', 'programs',
    'program_registrations', 'products', 'orders', 'order_items'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated, service_role', table_name);
    execute format(
      'create policy admin_all on public.%I for all to authenticated
       using ((select auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')
       with check ((select auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')',
      table_name
    );
  end loop;
end;
$$;

grant select on public.site_settings, public.article_categories, public.articles,
  public.ustadz_profiles, public.programs, public.products to anon;

create policy public_site_settings on public.site_settings
  for select to anon, authenticated
  using (key in ('qris_image_url', 'whatsapp_admin', 'about_content', 'vision_mission', 'founder_profile'));

create policy public_article_categories on public.article_categories
  for select to anon, authenticated using (true);

create policy public_published_articles on public.articles
  for select to anon, authenticated using (is_published and published_at <= now());

create policy public_active_ustadz on public.ustadz_profiles
  for select to anon, authenticated using (is_active);

create policy public_active_programs on public.programs
  for select to anon, authenticated using (status in ('OPEN', 'FULL'));

create policy public_active_products on public.products
  for select to anon, authenticated using (is_active);

-- p_items: [{ "product_id": UUID, "variant": string | null, "qty": integer }].
-- Checkout server menetapkan nomor pesanan dan tarif ongkir yang sudah diverifikasi.
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
  p_items jsonb
)
returns public.orders
language plpgsql
security invoker
set search_path = ''
as $$
declare
  requested record;
  locked_product public.products%rowtype;
  created_order public.orders%rowtype;
  order_subtotal integer := 0;
begin
  if p_shipping_cost is null or p_shipping_cost < 0 then
    raise exception 'Tarif ongkir tidak valid' using errcode = '22023';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Item pesanan harus berupa array' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) = 0 or exists (
    select 1
    from jsonb_to_recordset(p_items) as item(product_id uuid, variant text, qty integer)
    where item.product_id is null or item.qty is null or item.qty <= 0
  ) then
    raise exception 'Item atau jumlah pesanan tidak valid' using errcode = '22023';
  end if;

  -- Kunci produk dalam urutan yang sama dengan RPC pengembalian stok.
  for requested in
    select item.product_id, sum(item.qty) as total_qty
    from jsonb_to_recordset(p_items) as item(product_id uuid, variant text, qty integer)
    group by item.product_id
    order by item.product_id
  loop
    select * into locked_product
    from public.products
    where id = requested.product_id
    for update;

    if not found or not locked_product.is_active then
      raise exception 'Produk tidak tersedia' using errcode = 'P0001';
    end if;

    if locked_product.stock < requested.total_qty then
      raise exception 'Stok produk tidak mencukupi' using errcode = 'P0001';
    end if;

    order_subtotal := order_subtotal + locked_product.price * requested.total_qty;
    update public.products set stock = stock - requested.total_qty where id = locked_product.id;
  end loop;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(product_id uuid, variant text, qty integer)
    join public.products as product on product.id = item.product_id
    where case
      when cardinality(product.variants) = 0 then item.variant is not null
      else (item.variant = any (product.variants)) is distinct from true
    end
  ) then
    raise exception 'Varian produk tidak valid' using errcode = '22023';
  end if;

  insert into public.orders (
    order_number, customer_name, customer_email, phone_wa, province, city, district,
    postal_code, full_address, courier_name, courier_service, shipping_cost, subtotal, total_amount
  )
  values (
    p_order_number, p_customer_name, p_customer_email, p_phone_wa, p_province, p_city, p_district,
    p_postal_code, p_full_address, p_courier_name, p_courier_service, p_shipping_cost,
    order_subtotal, order_subtotal + p_shipping_cost
  )
  returning * into created_order;

  insert into public.order_items (order_id, product_id, product_name, variant, qty, unit_price)
  select created_order.id, product.id, product.name, item.variant, sum(item.qty), product.price
  from jsonb_to_recordset(p_items) as item(product_id uuid, variant text, qty integer)
  join public.products as product on product.id = item.product_id
  group by product.id, item.variant;

  return created_order;
end;
$$;

-- Panggil setelah webhook Midtrans memverifikasi transaksi dan status expire melalui API Midtrans.
-- RPC ini memiliki transisi status, sehingga webhook ulang tidak menambah stok dua kali.
-- Perubahan status ke PAID juga harus bersyarat pay_status = 'PENDING'.
create function public.restore_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  reserved_item record;
begin
  update public.orders set pay_status = 'EXPIRED'
  where id = p_order_id and pay_status = 'PENDING';

  if not found then
    return false;
  end if;

  for reserved_item in
    select product_id, sum(qty) as total_qty
    from public.order_items
    where order_id = p_order_id
    group by product_id
    order by product_id
  loop
    update public.products set stock = stock + reserved_item.total_qty
    where id = reserved_item.product_id;
  end loop;

  return true;
end;
$$;

revoke all on function public.create_merchandise_order(
  text, text, text, text, text, text, text, text, text, text, text, integer, jsonb
) from public, anon, authenticated, service_role;
grant execute on function public.create_merchandise_order(
  text, text, text, text, text, text, text, text, text, text, text, integer, jsonb
) to service_role;

revoke all on function public.restore_order_stock(uuid) from public, anon, authenticated, service_role;
grant execute on function public.restore_order_stock(uuid) to service_role;

commit;
