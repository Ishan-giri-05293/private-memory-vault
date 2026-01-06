import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page always
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Check for Firebase auth cookie
  const isLoggedIn = request.cookies.get("firebase-auth")?.value;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply to all routes
export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
