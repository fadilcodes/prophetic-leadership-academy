# Pedoman Arsitektur Prophetic Leadership Academy (PLA)

## Stack dan struktur proyek

- Gunakan Next.js App Router, TypeScript dengan mode strict, Tailwind CSS, Lucide Icons, dan shadcn/ui.
- Tempatkan rute di `app/`, komponen tata letak global di `components/layout/`, dan primitif shadcn/ui di `components/ui/`.
- Gunakan Server Components secara default. Pakai Client Components untuk bagian yang memerlukan interaksi atau API browser.

## Brand dan palet warna

Gunakan token warna dari `app/globals.css` agar komponen tetap konsisten.

| Peran | Warna | Nilai |
| --- | --- | --- |
| Latar utama | Warm Cream | `#F8F5EE` |
| Permukaan dan kartu | Pure White | `#FFFFFF` |
| Primer, brand, dan judul | Deep Emerald | `#073F32` |
| Aksen dan CTA | Warm Gold | `#C6A45B` |
| Teks isi | Hijau gelap | `#1E2925` |

## Tipografi

- Muat Google Fonts melalui `next/font/google` di `app/layout.tsx`.
- Terapkan `Playfair_Display` bobot 600 dan 700 pada H1–H3.
- Terapkan `Plus_Jakarta_Sans` bobot 400, 500, 600, dan 700 pada isi, UI, tombol, dan form.

## Prinsip UX

- Rancang mobile-first. Pastikan navigasi, target sentuh, dan fokus keyboard tetap jelas di setiap ukuran layar.
- Gunakan guest checkout. Pengunjung publik dapat mengakses situs dan menyelesaikan checkout tanpa wajib login.
- Utamakan teks Deep Emerald `#073F32` di atas tombol Warm Gold `#C6A45B` untuk kontras tinggi. Varian teks putih di atas Warm Gold menggunakan border halus dan hanya boleh dipakai bila kombinasi teks dan latarnya memenuhi kontras yang diperlukan. Border saja tidak meningkatkan kontras teks.
- Pertahankan Navbar sticky berlatar Warm Cream dan Footer berlatar Deep Emerald pada tata letak publik.

## Pembayaran Midtrans

- Gunakan Midtrans Snap API untuk membuat transaksi dari server dan HTTP Notification Webhook untuk memperbarui status pembayaran.
- Simpan `MIDTRANS_SERVER_KEY` di server. Gunakan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` untuk Snap.js. Setel `MIDTRANS_IS_PRODUCTION=false` untuk sandbox.
- Daftarkan `/api/webhooks/midtrans` sebagai endpoint notifikasi pembayaran. Verifikasi status transaksi melalui API Midtrans dan cocokkan ID pesanan serta nominal sebelum memperbarui status pembayaran.

## Struktur rute

| Rute | Fungsi |
| --- | --- |
| `/` | Beranda |
| `/tentang-pla` | Profil akademi |
| `/program` | Daftar program |
| `/program/[slug]` | Detail program |
| `/edukasi` | Daftar materi edukasi |
| `/edukasi/[slug]` | Detail materi edukasi |
| `/ustadz` | Daftar ustadz |
| `/merchandise` | Katalog merchandise |
| `/merchandise/[slug]` | Detail produk |
| `/checkout` | Checkout publik tanpa wajib login |
| `/donasi` | Donasi |
| `/kontak` | Kontak resmi |
| `/api/webhooks/midtrans` | Endpoint HTTP Notification Midtrans |
| `/admin/*` | Area administrasi dengan autentikasi dan otorisasi |

Jalankan `npm run build` untuk memverifikasi kompilasi dan pemeriksaan TypeScript sebelum menyelesaikan perubahan.
