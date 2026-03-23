export interface RenewTokenResponse {
  token: string;
  success: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function renewToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/renew-token', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data: RenewTokenResponse = await response.json();
    return data.token;
  } catch {
    return null;
  }
}

export async function logoutFromBackend(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function revokeAllSessions(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/revoke-all', {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function isTokenExpiredError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as { status: number }).status === 401;
  }

  return false;
}

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
        return await operation();
      }

      throw error;
    }

    throw error;
  }
}
