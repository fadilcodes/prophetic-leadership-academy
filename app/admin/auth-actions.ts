"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function loginAdmin(form: FormData) {
  const email = form.get("email");
  const password = form.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    redirect("/admin/login?error=kredensial");
  }

  const db = await createClient();
  const { data, error } = await db.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) redirect("/admin/login?error=kredensial");
  if (data.user.app_metadata.role !== "admin") {
    await db.auth.signOut({ scope: "local" });
    redirect("/admin/login?error=akses");
  }
  redirect("/admin");
}

export async function logoutAdmin() {
  const db = await createClient();
  await db.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}
