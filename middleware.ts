import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = "/admin/login";
  login.search = "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.redirect(login);

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.app_metadata?.role === "admin") return response;

  if (data?.claims?.sub) login.searchParams.set("error", "akses");
  const redirect = NextResponse.redirect(login);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  redirect.headers.set("Cache-Control", "private, no-store");
  return redirect;
}

export const config = { matcher: ["/admin/:path*"], runtime: "nodejs" };
