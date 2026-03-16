import { headers } from 'next/headers';

/**
 * Gets the real public hostname from request headers.
 * Azure Static Web Apps replaces `host` with an internal hostname,
 * so we read `x-forwarded-host` first (Azure sets this to the public domain).
 * Falls back to `host` (works in local dev).
 * Last resort: parse `x-ms-original-url` (always set by Azure).
 */
export async function getRequestHost(): Promise<string | undefined> {
  try {
    const h = await headers();
    const forwarded = h.get('x-forwarded-host');
    if (forwarded) return forwarded;

    const host = h.get('host');
    if (host) return host;

    const originalUrl = h.get('x-ms-original-url');
    if (originalUrl) {
      try { return new URL(originalUrl).host; } catch { /* ignore */ }
    }

    return undefined;
  } catch {
    return undefined;
  }
}
