import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function checkAdminAuth(request: NextRequest): boolean {
  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return true; // no credentials = allow in dev
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  try {
    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
    const [u, p] = decoded.split(":", 2);
    return u === user && p === pass;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/api/admin")
  ) {
    if (!checkAdminAuth(request)) {
      return new NextResponse("Admin login required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="COMP\'D Admin"',
        },
      });
    }
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            response.cookies.set(name, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/auth/");
  const isPublic =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/invite");
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");

  if (user && isAuthRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (!user && !isAuthRoute && !isPublic && !isAdmin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
