alter policy public_site_settings on public.site_settings
  using (key in (
    'qris_image_url', 'whatsapp_admin', 'about_content', 'vision_mission', 'founder_profile',
    'core_values', 'contact_info', 'donation_content'
  ));

-- core_values: [{ "title": "...", "description": "..." }]
-- donation_content: "... penjelasan penyaluran dana ..."
-- founder_profile: { "name": "...", "title": "...", "bio": "...", "photo_url": "..." }
-- contact_info: { "email": "...", "address": "...", "maps_url": "https://...",
--                 "social_links": [{ "label": "...", "url": "https://..." }] }

-- Versi 002 dahulu berisi kebijakan di atas. Database yang sudah mencatatnya akan melewati 002_switch_to_midtrans.sql.
do $$
declare
  target_table regclass;
  old_constraint text;
begin
  foreach target_table in array array['public.program_registrations'::regclass, 'public.orders'::regclass]
  loop
    if exists (
      select 1 from pg_attribute
      where attrelid = target_table and attname = 'xendit_invoice_id' and not attisdropped
    ) then
      execute format('alter table %s rename column xendit_invoice_id to midtrans_order_id', target_table);
    end if;

    if exists (
      select 1 from pg_attribute
      where attrelid = target_table and attname = 'xendit_invoice_url' and not attisdropped
    ) then
      execute format('alter table %s rename column xendit_invoice_url to midtrans_redirect_url', target_table);
    end if;

    select conname into old_constraint
    from pg_constraint
    where conrelid = target_table and contype = 'u'
      and conname in ('program_registrations_xendit_invoice_id_key', 'orders_xendit_invoice_id_key');

    if old_constraint is not null then
      execute format(
        'alter table %s rename constraint %I to %I',
        target_table, old_constraint, replace(old_constraint, 'xendit_invoice_id', 'midtrans_order_id')
      );
    end if;
  end loop;
end;
$$;
