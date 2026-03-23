import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { jwtDecode } from 'jwt-decode';
import { cookies } from 'next/headers';
import { getTenantHeaders } from '@/services/tenant-headers';
import { getRequestHost } from '@/lib/get-host';

interface LoginResponse {
  AccessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

interface DecodedJWT {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

interface ExtendedUser extends User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

const REFRESH_THRESHOLD_SECONDS = 5 * 60;

async function refreshAccessToken(cookieHeader: string, tenantHost?: string): Promise<{ token: string; exp: number } | null> {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/renew-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        ...(await getTenantHeaders(tenantHost)),
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.token) return null;

    const decoded: DecodedJWT = jwtDecode(data.token);
    return {
      token: data.token,
      exp: decoded.exp || 0,
    };
  } catch {
    return null;
  }
}

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const reqHeaders = req?.headers as Record<string, string> | undefined;
        const host = await getRequestHost() || reqHeaders?.host || undefined;
        const tenantH = await getTenantHeaders(host);

        const res = await fetch(`${process.env.BACKEND_URL}/login`, {
          method: "POST",
          credentials: 'include',
          headers: { "Content-Type": "application/json", ...tenantH },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });

        if (!res.ok) return null;

        const data: LoginResponse = await res.json();
        if (!data || !data.AccessToken) return null;

        try {
          const decoded: ExtendedUser = jwtDecode(data.AccessToken);
          return {
            ...decoded,
            token: data.AccessToken,
          };
        } catch {
          return null;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account && account?.provider === "credentials") {
        const { token: accessToken, ...userInfo } = user as any;
        token.user = userInfo;
        token.accessToken = accessToken;

        try {
          const decoded: DecodedJWT = jwtDecode(accessToken);
          token.accessTokenExpires = decoded.exp ? decoded.exp * 1000 : 0;
        } catch {
          token.accessTokenExpires = 0;
        }

        return token;
      }

      const now = Date.now();
      const expiresAt = (token.accessTokenExpires as number) || 0;
      const shouldRefresh = expiresAt > 0 && (expiresAt - now) < REFRESH_THRESHOLD_SECONDS * 1000;

      if (shouldRefresh && token.accessToken) {
        try {
          const cookieStore = await cookies();
          const allCookies = cookieStore.getAll();
          const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ');

          let tenantHost: string | undefined;
          try {
            tenantHost = await getRequestHost();
          } catch {}

          if (cookieHeader) {
            const refreshed = await refreshAccessToken(cookieHeader, tenantHost);
            if (refreshed) {
              token.accessToken = refreshed.token;
              token.accessTokenExpires = refreshed.exp * 1000;
            } else {
              token.error = 'RefreshTokenError';
            }
          }
        } catch {
          token.error = 'RefreshTokenError';
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = token.user as ExtendedUser;
      (session as any).accessToken = token.accessToken;
      if (token.error) {
        (session as any).error = token.error;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url === baseUrl || url === `${baseUrl}/`) {
        return baseUrl;
      }

      if (url.startsWith(`${baseUrl}/admin`) || url.startsWith('/admin')) {
        return url;
      }

      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;

      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET
};
