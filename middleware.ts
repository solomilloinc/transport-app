import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Define los tipos de roles disponibles
type Role = "Admin" | "User" | "Client"

// Define la estructura para las configuraciones de ruta
interface RouteConfig {
  roles: Role[]
  redirectTo?: string
}

// Mapa de rutas con sus configuraciones de acceso
const routeConfigs: Record<string, RouteConfig> = {
  // Rutas de administrador
  "/admin": { roles: ["Admin"], redirectTo: "/unauthorized" },
  // "/admin/reservations": { roles: ["Admin"], redirectTo: "/unauthorized" },
  // "/admin/customers": { roles: ["Admin"], redirectTo: "/unauthorized" },
  // "/admin/customers/debts": { roles: ["Admin"], redirectTo: "/unauthorized" },
  // "/admin/vehicles": { roles: ["Admin"], redirectTo: "/unauthorized" },
  // "/admin/pricing": { roles: ["Admin"], redirectTo: "/unauthorized" },
  // "/admin/drivers": { roles: ["Admin"], redirectTo: "/unauthorized" },
  // "/admin/routes": { roles: ["Admin"], redirectTo: "/unauthorized" },
  // "/admin/settings": { roles: ["Admin"], redirectTo: "/unauthorized" },

  // Rutas de usuario (empleados)
  "/admin/reserves": { roles: ["User"], redirectTo: "/unauthorized" },
  "/admin/passengers": { roles: ["User"], redirectTo: "/unauthorized" },

  // Rutas de cliente
  "/passengers/bookings": { roles: ["Client"], redirectTo: "/unauthorized" },
  "/passengers/profile": { roles: ["Client"], redirectTo: "/unauthorized" },
}

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/", "/login", "/register", "/unauthorized", "/api/auth"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar si la ruta es pública
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verificar si la ruta está en nuestras configuraciones
  const matchingRoute = Object.keys(routeConfigs).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (!matchingRoute) {
    // Si la ruta no está en nuestras configuraciones, permitir el acceso
    return NextResponse.next()
  }

  // Obtener el token de sesión
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Si no hay token, redirigir al login
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }
  const userRole = ((token.user as Record<string, unknown>)["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as string) as Role

  console.log(userRole)
  if (!userRole || !routeConfigs[matchingRoute].roles.includes(userRole)) {
    // Si el usuario no tiene el rol adecuado, redirigir a la página no autorizada
    const redirectTo = routeConfigs[matchingRoute].redirectTo || "/unauthorized"
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Si todo está bien, permitir el acceso
  return NextResponse.next()
}

// Configurar en qué rutas se ejecutará el middleware
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. Archivos estáticos (_next/static, favicon.ico, etc.)
     * 2. Rutas de API que no necesitan verificación de roles
     */
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
}
