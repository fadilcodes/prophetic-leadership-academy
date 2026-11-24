import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function getAdminContext(response?: NextResponse) {
  const db = await createClient(response);
  const { data } = await db.auth.getUser();
  const user = data.user;
  return { db, user, isAdmin: user?.app_metadata.role === "admin" };
}

export const requireAdmin = cache(async () => {
  const context = await getAdminContext();
  if (!context.isAdmin) redirect(context.user ? "/admin/login?error=akses" : "/admin/login");
  return context.db;
});
