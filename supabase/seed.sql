-- Data demo PLA. Nama ustadz, agenda, dan produk di bawah ini fiktif.
begin;

insert into public.site_settings (key, value) values
  ('qris_image_url', 'null'),
  ('whatsapp_admin', 'null'),
  ('donation_content', 'null'),
  ('contact_info', 'null'),
  ('about_content', to_jsonb('PLA adalah ruang belajar untuk menumbuhkan kepemimpinan yang berlandaskan keteladanan Nabi, amanah, dan pelayanan kepada masyarakat.'::text)),
  ('vision_mission', '{
    "vision": "Menumbuhkan pemimpin berakhlak yang bermanfaat bagi masyarakat.",
    "mission": [
      "Menyediakan pendidikan kepemimpinan profetik yang mudah diakses.",
      "Mendampingi komunitas dalam merancang kegiatan dakwah yang relevan dan berkelanjutan.",
      "Membiasakan musyawarah, refleksi, dan pelayanan dalam praktik kepemimpinan."
    ]
  }'),
  ('core_values', 'null'),
  ('founder_profile', 'null')
on conflict (key) do nothing;

insert into public.article_categories (name, slug) values
  ('Kepemimpinan Profetik', 'kepemimpinan-profetik'),
  ('Sirah dan Akhlak', 'sirah-dan-akhlak'),
  ('Dakwah Komunitas', 'dakwah-komunitas')
on conflict (slug) do nothing;

insert into public.articles (category_id, title, slug, excerpt, content, is_published, published_at)
select category.id, article.title, article.slug, article.excerpt, article.content, true,
  now() - article.days_ago * interval '1 day'
from (
  values
    ('kepemimpinan-profetik', 'Amanah Dimulai dari Janji Kecil', 'amanah-dimulai-dari-janji-kecil',
      'Tiga kebiasaan untuk melatih amanah di rumah, sekolah, dan organisasi.',
      'Catat setiap janji yang Anda buat, tentukan siapa yang perlu mendapat kabar, dan sampaikan perubahan sedini mungkin. Pada akhir pekan, tinjau satu janji yang terpenuhi dan satu yang perlu diperbaiki.', 21),
    ('sirah-dan-akhlak', 'Belajar Bermusyawarah dari Sirah', 'belajar-bermusyawarah-dari-sirah',
      'Kebiasaan mendengar dan merangkum pendapat sebelum mengambil keputusan bersama.',
      'Mulailah musyawarah dengan satu pertanyaan yang jelas. Undang setiap anggota untuk menjelaskan alasannya, rangkum perbedaan yang masih ada, lalu akhiri dengan keputusan dan pembagian tanggung jawab.', 14),
    ('dakwah-komunitas', 'Menyusun Agenda Dakwah Berbasis Kebutuhan Warga', 'agenda-dakwah-berbasis-kebutuhan-warga',
      'Panduan singkat merancang kegiatan komunitas dari percakapan dengan warga.',
      'Temui beberapa warga dan tanyakan kegiatan apa yang mereka butuhkan, waktu yang memungkinkan, serta kendala untuk hadir. Uji satu kegiatan sederhana dan gunakan umpan balik peserta untuk merancang agenda berikutnya.', 7),
    ('kepemimpinan-profetik', 'Menutup Rapat dengan Pembagian Tanggung Jawab', 'menutup-rapat-dengan-pembagian-tanggung-jawab',
      'Panduan singkat agar keputusan rapat bisa ditindaklanjuti oleh tim.',
      'Sebelum menutup rapat, bacakan kembali keputusan yang sudah disepakati. Tanyakan siapa yang bersedia menangani setiap tugas dan kapan hasilnya perlu dibagikan. Pada pertemuan berikutnya, gunakan catatan rapat untuk meninjau kemajuan dan membicarakan kendala.', 28)
) as article(category_slug, title, slug, excerpt, content, days_ago)
join public.article_categories as category on category.slug = article.category_slug
on conflict (slug) do nothing;

insert into public.ustadz_profiles (id, name, title, bio, expertise_tags) values
  ('a36044c9-93b3-48e4-9a77-e74eb61cb829', 'Ustadz Naufal Hakim', 'Fasilitator Kepemimpinan Profetik',
    'Mendampingi pengurus organisasi pemuda berlatih mengambil keputusan, membagi peran, dan mengevaluasi kerja tim.',
    array['Kepemimpinan', 'Manajemen Tim']),
  ('28ec304b-4f16-45ce-98f0-69746f859225', 'Ustadz Faris Maulana', 'Pengajar Sirah dan Akhlak',
    'Memandu kajian sirah untuk remaja dan keluarga dengan diskusi tentang penerapan akhlak dalam kehidupan sehari-hari.',
    array['Sirah Nabawiyah', 'Akhlak']),
  ('f246f726-1571-4f52-9274-71ca8173b947', 'Ustadz Ridwan Haris', 'Pendamping Komunitas Dakwah',
    'Membantu relawan masjid memetakan kebutuhan warga dan merancang kegiatan yang bisa dijalankan dengan sumber daya setempat.',
    array['Dakwah Komunitas', 'Pengembangan Relawan'])
on conflict (id) do nothing;

insert into public.programs (
  ustadz_id, title, slug, category, mode, is_paid, price, quota, schedule_date,
  location_or_platform, description, syllabus
) values
  ('a36044c9-93b3-48e4-9a77-e74eb61cb829', 'Lokakarya Amanah untuk Pengurus Muda', 'lokakarya-amanah-pengurus-muda',
    'Pelatihan', 'Offline', true, 175000, 30, (current_date + 30 + time '09:00') at time zone 'Asia/Jakarta',
    'Ruang pelatihan di Kota Bandung', 'Lokakarya sehari untuk pengurus muda yang ingin membangun kebiasaan kerja tim yang bertanggung jawab.',
    '["Pemetaan tanggung jawab", "Simulasi musyawarah", "Rencana tindak lanjut"]'),
  ('28ec304b-4f16-45ce-98f0-69746f859225', 'Kajian Sirah: Seni Mendengar', 'kajian-sirah-seni-mendengar',
    'Kajian', 'Online', false, 0, 120, (current_date + 14 + time '19:30') at time zone 'Asia/Jakarta',
    'Zoom', 'Kajian terbuka tentang adab mendengar. Sesi ditutup dengan tanya jawab dan refleksi pribadi.',
    '["Adab menyimak", "Refleksi sirah", "Tanya jawab"]'),
  ('f246f726-1571-4f52-9274-71ca8173b947', 'Pendampingan Tim Dakwah Masjid', 'pendampingan-tim-dakwah-masjid',
    'Pendampingan', 'Online', true, 350000, 12, (current_date + 45 + time '19:30') at time zone 'Asia/Jakarta',
    'Google Meet', 'Tiga sesi pendampingan untuk tim masjid, mulai dari wawancara warga hingga evaluasi kegiatan.',
    '["Pemetaan kebutuhan", "Penyusunan agenda", "Evaluasi kegiatan"]')
on conflict (slug) do nothing;

insert into public.products (name, slug, description, price, weight_gram, stock, variants, material) values
  ('Jurnal Amanah PLA', 'jurnal-amanah-pla',
    'Jurnal A5 dengan ruang untuk mencatat tujuan pekanan, tanggung jawab, dan refleksi.', 79000, 280, 40,
    array['Emerald', 'Cream'], 'Kertas dan sampul kain'),
  ('Totebag Musyawarah', 'totebag-musyawarah',
    'Tas kanvas untuk membawa buku dan perlengkapan kajian.', 65000, 210, 28,
    array['Natural', 'Emerald'], 'Kanvas'),
  ('Kartu Diskusi Akhlak', 'kartu-diskusi-akhlak',
    'Set 24 kartu berisi pertanyaan refleksi untuk keluarga dan kelompok belajar.', 55000, 160, 32,
    array[]::text[], 'Karton')
on conflict (slug) do nothing;

commit;
