import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { AppRole, isAdminRole, normalizeRole } from "@/lib/auth-role";

interface RouteConfig {
  roles: AppRole[];
  redirectTo: string;
}

const routeConfigs: Record<string, RouteConfig> = {
  "/admin/reserves": { roles: ["admin", "superadmin", "user"], redirectTo: "/" },
  "/admin/customers": { roles: ["admin", "superadmin", "user"], redirectTo: "/" },
  "/admin/frequent-subscriptions": { roles: ["admin", "superadmin", "user"], redirectTo: "/" },
  "/admin/services": { roles: ["admin", "superadmin"], redirectTo: "/" },
  "/admin/drivers": { roles: ["admin", "superadmin"], redirectTo: "/" },
  "/admin/cities": { roles: ["admin", "superadmin"], redirectTo: "/" },
  "/admin/directions": { roles: ["admin", "superadmin"], redirectTo: "/" },
  "/admin/vehicles": { roles: ["admin", "superadmin"], redirectTo: "/" },
  "/admin/trips": { roles: ["admin", "superadmin"], redirectTo: "/" },
  "/admin/prices": { roles: ["admin", "superadmin"], redirectTo: "/" },
  "/admin/holidays": { roles: ["admin", "superadmin"], redirectTo: "/" },
  "/admin/users": { roles: ["admin", "superadmin"], redirectTo: "/" },
  "/account/bookings": { roles: ["client"], redirectTo: "/" },
  "/account/profile": { roles: ["client"], redirectTo: "/" },
};

const publicRoutePrefixes = ["/api/auth", "/images", "/_next"];
const publicRoutes = ["/", "/results", "/checkout", "/booking-confirmation", "/unauthorized"];
const redirectRoutes = ["/admin", "/account"];
const incompleteClientAllowedPrefixes = ["/api/auth", "/auth"];

function isPublicPath(pathname: string): boolean {
  return publicRoutes.includes(pathname) || publicRoutePrefixes.some((prefix) => pathname.startsWith(prefix));
}

function getRole(token: Awaited<ReturnType<typeof getToken>>): AppRole | null {
  const sessionToken = token as Record<string, unknown> | null;
  const tokenUser =
    sessionToken && typeof sessionToken.user === "object"
      ? (sessionToken.user as Record<string, unknown>)
      : null;
  const rawRole =
    tokenUser && typeof tokenUser.role === "string"
      ? tokenUser.role
      : typeof sessionToken?.role === "string"
        ? sessionToken.role
        : null;

  return normalizeRole(rawRole);
}

function needsProfileCompletion(token: Awaited<ReturnType<typeof getToken>>): boolean {
  const sessionToken = token as Record<string, unknown> | null;
  const tokenUser =
    sessionToken && typeof sessionToken.user === "object"
      ? (sessionToken.user as Record<string, unknown>)
      : null;

  if (tokenUser && "needsProfileCompletion" in tokenUser) {
    return Boolean(tokenUser.needsProfileCompletion);
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = getRole(token);
  const profileIncomplete = role === "client" && needsProfileCompletion(token);

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (profileIncomplete && incompleteClientAllowedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (redirectRoutes.includes(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (role === "client") {
      const target = profileIncomplete ? "/" : "/account/bookings";
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (role === "user" || isAdminRole(role)) {
      return NextResponse.redirect(new URL("/admin/reserves", request.url));
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  const matchingRoute = Object.keys(routeConfigs).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!matchingRoute) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!role || !routeConfigs[matchingRoute].roles.includes(role)) {
    return NextResponse.redirect(new URL(routeConfigs[matchingRoute].redirectTo, request.url));
  }

  if (role === "client" && profileIncomplete) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
