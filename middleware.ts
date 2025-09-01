import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Define los tipos de roles disponibles
type Role = "admin" | "user" | "client"

// Define la estructura para las configuraciones de ruta
interface RouteConfig {
  roles: Role[]
  redirectTo?: string
}

// Mapa de rutas con sus configuraciones de acceso
const routeConfigs: Record<string, RouteConfig> = {
  // Rutas de administrador - permitir acceso a /admin para redirección
  "/admin/reserves": { roles: ["admin"], redirectTo: "/" },
  "/admin/passengers": { roles: ["admin"], redirectTo: "/" },
  "/admin/vehicles": { roles: ["admin"], redirectTo: "/" },
  "/admin/drivers": { roles: ["admin"], redirectTo: "/" },
  "/admin/directions": { roles: ["admin"], redirectTo: "/" },
  "/admin/cities": { roles: ["admin"], redirectTo: "/" },
  "/admin/services": { roles: ["admin"], redirectTo: "/" },
  "/admin/holidays": { roles: ["admin"], redirectTo: "/" },
  "/admin/prices": { roles: ["admin"], redirectTo: "/" },

  // Rutas de cliente
  "/passengers/bookings": { roles: ["client"], redirectTo: "/" },
  "/passengers/profile": { roles: ["client"], redirectTo: "/" },
}

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/", "/login", "/register", "/unauthorized", "/api/auth"]

// Rutas especiales que requieren autenticación pero tienen lógica de redirección propia
const redirectRoutes = ["/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar si la ruta es pública
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verificar si es una ruta de redirección que necesita autenticación básica
  if (redirectRoutes.includes(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // Si no hay token, redirigir al login
    if (!token) {
      const url = new URL("/", request.url)
      return NextResponse.redirect(url)
    }

    // Si hay token, permitir que la página maneje la redirección
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
  // Intentar obtener el rol de diferentes lugares del token
  let userRole: Role | null = null;
  
  // Primero intentar desde token.user.role (NextAuth estándar)
  if (token.user && typeof token.user === 'object' && 'role' in token.user) {
    userRole = (token.user.role as string).toLowerCase() as Role;
  }
  
  // Si no está ahí, intentar desde el claim de Microsoft
  if (!userRole && token.user && typeof token.user === 'object') {
    const msRole = (token.user as Record<string, unknown>)["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    if (msRole && typeof msRole === 'string') {
      userRole = msRole.toLowerCase() as Role;
    }
  }
  
  console.log('User role:', userRole, 'Required roles:', routeConfigs[matchingRoute].roles);
  
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
