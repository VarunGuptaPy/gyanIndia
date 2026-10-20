import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// Defence in depth: every protected page and handler also re-checks the session and
// permissions on the server. This middleware only stops unauthenticated traffic early.
export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;
    if (path.startsWith("/api/") && !req.nextauth.token) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }
    if ((path.startsWith("/admin") || path.startsWith("/api/admin")) && (!role || role === "GUARDIAN")) {
      if (path.startsWith("/api/")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    // API routes are allowed through so the handler above can answer 401 JSON instead of redirecting.
    callbacks: { authorized: ({ token, req }) => req.nextUrl.pathname.startsWith("/api/") || !!token },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/api/admin/:path*", "/api/student/:path*"],
};
