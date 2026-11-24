import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import type { Database } from "@/types/database";

/** Teruskan respons yang dikembalikan Route Handler saat menulis sesi autentikasi. */
export async function createClient(response?: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY wajib diisi.");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        if (response) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [name, value] of Object.entries(headersToSet)) {
            response.headers.set(name, value);
          }
          return;
        }

        for (const { name, value, options } of cookiesToSet) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Server Components hanya dapat membaca cookie. Route Handlers dapat menulisnya.
            if (
              !(error instanceof Error) ||
              !error.message.startsWith("Cookies can only be modified")
            ) {
              throw error;
            }
            break;
          }
        }
      },
    },
  });
}
