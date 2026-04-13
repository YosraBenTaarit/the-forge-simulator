import { auth } from "@/auth";

export const middleware = auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  // Public routes
  const publicRoutes = ["/login", "/register", "/"];

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && publicRoutes.includes(pathname)) {
    return Response.redirect(new URL("/scenarios", req.nextUrl.origin));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !publicRoutes.includes(pathname)) {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
