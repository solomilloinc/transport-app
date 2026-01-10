/**
 * Servicios de autenticación para el cliente (browser)
 *
 * Maneja la renovación de tokens, logout y revocación de sesiones
 * comunicándose con los API routes de Next.js que actúan como proxy
 * hacia el backend.
 */

export interface RenewTokenResponse {
  token: string;
  success: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Renueva el accessToken usando el refreshToken almacenado en cookie HttpOnly.
 * Llamar cuando recibas un error 401.
 *
 * @returns El nuevo accessToken o null si la renovación falló
 */
export async function renewToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/renew-token', {
      method: 'POST',
      credentials: 'include', // Importante: envía las cookies
    });

    if (!response.ok) {
      // Token inválido o expirado - el usuario debe re-autenticarse
      console.error('Token renewal failed:', response.status);
      return null;
    }

    const data: RenewTokenResponse = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error renovando token:', error);
    return null;
  }
}

/**
 * Cierra la sesión actual revocando el refresh token en el backend.
 * Debe llamarse ANTES de signOut() de NextAuth.
 *
 * @returns true si el logout fue exitoso
 */
export async function logoutFromBackend(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.error('Error en logout:', error);
    return false;
  }
}

/**
 * Revoca TODAS las sesiones del usuario en todos los dispositivos.
 * Útil cuando el usuario sospecha que su cuenta fue comprometida.
 *
 * @returns true si la revocación fue exitosa
 */
export async function revokeAllSessions(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/revoke-all', {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.error('Error revocando sesiones:', error);
    return false;
  }
}

/**
 * Verifica si un error de respuesta indica que el token expiró (401)
 */
export function isTokenExpiredError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as { status: number }).status === 401;
  }
  return false;
}

/**
 * Helper para reintentar una operación después de renovar el token
 */
export async function withTokenRefresh<T>(
  operation: () => Promise<T>,
  onTokenRefreshed?: (newToken: string) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isTokenExpiredError(error)) {
      const newToken = await renewToken();
      if (newToken) {
        onTokenRefreshed?.(newToken);
        // Reintentar la operación
        return await operation();
      }
      // Si la renovación falla, propagar el error original
      throw error;
    }
    throw error;
  }
}
