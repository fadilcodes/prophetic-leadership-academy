import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#konten-utama"
        className="sr-only z-50 rounded-md bg-background px-4 py-3 text-primary focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Lewati ke konten utama
      </a>
      <Navbar />
      <main id="konten-utama" tabIndex={-1} className="flex-1 scroll-mt-24">
        {children}
      </main>
      <Footer />
    </>
  );
}
