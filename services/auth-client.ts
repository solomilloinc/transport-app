export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
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
