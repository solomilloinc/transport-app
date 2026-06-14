import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { normalizeRole } from "@/lib/auth-role";
import { getRequestHost } from "@/lib/get-host";
import { getTenantHeaders } from "@/services/tenant-headers";

interface AuthApiResponse {
  accessToken: string;
  refreshToken: string;
}

interface AuthBackendResult {
  error?: string;
  user?: ExtendedUser;
}

interface DecodedJWT {
  exp?: number;
  email?: string;
  name?: string;
  customer_id?: string | number;
  needs_profile_completion?: string | boolean;
  sub?: string;
  role?: string;
  [key: string]: unknown;
}

interface ExtendedUser extends User {
  id: string;
  email: string;
  role: string;
  name?: string;
  customerId?: number | null;
  needsProfileCompletion?: boolean;
  token: string;
  refreshToken: string;
}

const REFRESH_THRESHOLD_SECONDS = 5 * 60;
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const ID_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const EMAIL_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

function parseBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function mapDecodedUser(accessToken: string): Omit<ExtendedUser, "token" | "refreshToken"> {
  const decoded = jwtDecode<DecodedJWT>(accessToken);
  const rawRole =
    typeof decoded.role === "string"
      ? decoded.role
      : typeof decoded[ROLE_CLAIM] === "string"
        ? (decoded[ROLE_CLAIM] as string)
        : undefined;

  const role = normalizeRole(rawRole) ?? "client";
  const email =
    typeof decoded.email === "string"
      ? decoded.email
      : typeof decoded[EMAIL_CLAIM] === "string"
        ? (decoded[EMAIL_CLAIM] as string)
        : "";
  const name =
    typeof decoded.name === "string"
      ? decoded.name
      : typeof decoded[NAME_CLAIM] === "string"
        ? (decoded[NAME_CLAIM] as string)
        : undefined;
  const id =
    typeof decoded.sub === "string"
      ? decoded.sub
      : typeof decoded[ID_CLAIM] === "string"
        ? (decoded[ID_CLAIM] as string)
        : "";

  return {
    id,
    email,
    role,
    name,
    customerId: parseNumber(decoded.customer_id),
    needsProfileCompletion: parseBoolean(decoded.needs_profile_completion),
  };
}

function isValidAuthUser(user: Omit<ExtendedUser, "token" | "refreshToken">): boolean {
  const normalizedRole = normalizeRole(user.role);

  if (!user.id || !user.email || !normalizedRole) {
    return false;
  }

  if (normalizedRole === "client" && !user.customerId) {
    return false;
  }

  return true;
}

function getTokenExpiration(accessToken: string): number {
  try {
    const decoded = jwtDecode<DecodedJWT>(accessToken);
    return decoded.exp ? decoded.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function refreshAccessToken(refreshToken: string, tenantHost?: string): Promise<AuthApiResponse | null> {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/renew-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${encodeURIComponent(refreshToken)}`,
        ...(await getTenantHeaders(tenantHost)),
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { token?: string; refreshToken?: string };
    if (!data.token || !data.refreshToken) {
      return null;
    }

    return {
      accessToken: data.token,
      refreshToken: data.refreshToken,
    };
  } catch {
    return null;
  }
}

async function authenticateWithBackend(
  path: string,
  payload: Record<string, unknown>,
  tenantHost?: string
): Promise<AuthBackendResult> {
  const response = await fetch(`${process.env.BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getTenantHeaders(tenantHost)),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as
      | { detail?: string; title?: string; message?: string }
      | null;

    return {
      error:
        errorBody?.detail ||
        errorBody?.message ||
        errorBody?.title ||
        "No se pudo completar la autenticacion con Google.",
    };
  }

  const data = (await response.json()) as Partial<AuthApiResponse>;
  if (!data.accessToken || !data.refreshToken) {
    return { error: "La API de autenticacion no devolvio tokens validos." };
  }

  const mappedUser = mapDecodedUser(data.accessToken);
  if (!isValidAuthUser(mappedUser)) {
    return { error: "La autenticacion devolvio una sesion incompleta." };
  }

  return {
    user: {
      ...mappedUser,
      token: data.accessToken,
      refreshToken: data.refreshToken,
    },
  };
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
        const authResult = await authenticateWithBackend(
          "/login",
          {
            email: credentials?.email,
            password: credentials?.password,
          },
          host
        );

        return authResult.user ?? null;
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
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !account.id_token) {
        return true;
      }

      let tenantHost: string | undefined;
      try {
        tenantHost = await getRequestHost();
      } catch {
        tenantHost = undefined;
      }

      const authResult = await authenticateWithBackend(
        "/google-login",
        { idToken: account.id_token },
        tenantHost
      );

      if (!authResult.user) {
        const message = encodeURIComponent(
          authResult.error || "No se pudo completar la autenticacion con Google."
        );
        return `/auth/error?message=${message}`;
      }

      const authUser = authResult.user;
      Object.assign(user, authUser);
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user && (account?.provider === "credentials" || account?.provider === "google")) {
        const authUser = user as ExtendedUser;
        token.user = {
          id: authUser.id,
          email: authUser.email,
          role: authUser.role,
          name: authUser.name,
          customerId: authUser.customerId,
          needsProfileCompletion: authUser.needsProfileCompletion,
        };
        token.accessToken = authUser.token;
        token.refreshToken = authUser.refreshToken;
        token.accessTokenExpires = getTokenExpiration(authUser.token);
        token.error = undefined;
        return token;
      }

      if (trigger === "update" && session?.user) {
        token.user = {
          ...(token.user ?? {}),
          ...session.user,
        };
        return token;
      }

      const expiresAt = typeof token.accessTokenExpires === "number" ? token.accessTokenExpires : 0;
      const shouldRefresh =
        !!token.refreshToken &&
        expiresAt > 0 &&
        expiresAt - Date.now() < REFRESH_THRESHOLD_SECONDS * 1000;

      if (shouldRefresh) {
        let tenantHost: string | undefined;
        try {
          tenantHost = await getRequestHost();
        } catch {
          const cookieStore = await cookies();
          tenantHost = cookieStore.get("tenant-host")?.value;
        }

        const refreshed = await refreshAccessToken(token.refreshToken as string, tenantHost);
        if (!refreshed) {
          token.error = "RefreshTokenError";
          return token;
        }

        const mappedUser = mapDecodedUser(refreshed.accessToken);
        if (!isValidAuthUser(mappedUser)) {
          token.error = "RefreshTokenError";
          return token;
        }

        token.user = {
          id: mappedUser.id,
          email: mappedUser.email,
          role: mappedUser.role,
          name: mappedUser.name,
          customerId: mappedUser.customerId,
          needsProfileCompletion: mappedUser.needsProfileCompletion,
        };
        token.accessToken = refreshed.accessToken;
        token.refreshToken = refreshed.refreshToken;
        token.accessTokenExpires = getTokenExpiration(refreshed.accessToken);
        token.error = undefined;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.user?.id ?? "",
        email: token.user?.email ?? "",
        role: token.user?.role ?? "client",
        name: token.user?.name,
        customerId: token.user?.customerId,
        needsProfileCompletion: token.user?.needsProfileCompletion,
      };
      session.accessToken = token.accessToken;
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url === baseUrl || url === `${baseUrl}/`) {
        return baseUrl;
      }

      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (new URL(url).origin === baseUrl) {
        return url;
      }

      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
