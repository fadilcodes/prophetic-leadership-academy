import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel Admin PLA", template: "%s | Admin PLA" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
