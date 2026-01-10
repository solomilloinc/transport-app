import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { jwtDecode } from 'jwt-decode'
import { cookies } from 'next/headers'

// Tipado de respuesta de tu API
interface LoginResponse {
  AccessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

// Tipado del JWT decodificado
interface DecodedJWT {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

// Extendemos el User para que tenga los datos que vienen del token
interface ExtendedUser extends User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

// Tiempo antes de expiración para renovar (5 minutos en segundos)
const REFRESH_THRESHOLD_SECONDS = 5 * 60;

/**
 * Intenta renovar el accessToken usando el refreshToken de las cookies
 */
async function refreshAccessToken(cookieHeader: string): Promise<{ token: string; exp: number } | null> {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/renew-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
    });

    if (!response.ok) {
      console.error('Error renovando token:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.token) return null;

    const decoded: DecodedJWT = jwtDecode(data.token);
    return {
      token: data.token,
      exp: decoded.exp || 0,
    };
  } catch (error) {
    console.error('Error en refreshAccessToken:', error);
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
      async authorize(credentials) {
        const res = await fetch(`${process.env.BACKEND_URL}/login`, {
          method: "POST",
          credentials: 'include', // Necesario para recibir la cookie HttpOnly del refreshToken
          headers: { "Content-Type": "application/json" },
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
          // Retornamos el usuario + el token como propiedad aparte
          return {
            ...decoded,
            token: data.AccessToken,
          };
        } catch (err) {
          console.error("Error decodificando token:", err);
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
      // Login inicial - guardar token y expiración
      if (user && account && account?.provider === "credentials") {
        const { token: accessToken, ...userInfo } = user as any;
        token.user = userInfo;
        token.accessToken = accessToken;

        // Extraer expiración del JWT
        try {
          const decoded: DecodedJWT = jwtDecode(accessToken);
          token.accessTokenExpires = decoded.exp ? decoded.exp * 1000 : 0; // Convertir a ms
        } catch {
          token.accessTokenExpires = 0;
        }

        return token;
      }

      // En llamadas subsecuentes, verificar si el token está por expirar
      const now = Date.now();
      const expiresAt = (token.accessTokenExpires as number) || 0;
      const shouldRefresh = expiresAt > 0 && (expiresAt - now) < REFRESH_THRESHOLD_SECONDS * 1000;

      if (shouldRefresh && token.accessToken) {
        try {
          // Obtener las cookies del request actual
          const cookieStore = await cookies();
          const allCookies = cookieStore.getAll();
          const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ');

          if (cookieHeader) {
            const refreshed = await refreshAccessToken(cookieHeader);
            if (refreshed) {
              token.accessToken = refreshed.token;
              token.accessTokenExpires = refreshed.exp * 1000;
              console.log('Token renovado exitosamente');
            } else {
              // Si falla la renovación, marcar el token como expirado
              token.error = 'RefreshTokenError';
            }
          }
        } catch (error) {
          console.error('Error al renovar token:', error);
          token.error = 'RefreshTokenError';
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = token.user as ExtendedUser;
      (session as any).accessToken = token.accessToken;
      // Exponer error si la renovación falló
      if (token.error) {
        (session as any).error = token.error;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // If signing in and user is admin, redirect to admin/reserves
      if (url === baseUrl || url === `${baseUrl}/`) {
        return baseUrl;
      }
      
      // If user is going to /admin, they'll be handled by the page component
      if (url.startsWith(`${baseUrl}/admin`) || url.startsWith('/admin')) {
        return url;
      }

      // Default behavior
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET
};



// // Si viene de Google, podrías buscar el user desde tu API y agregar rol
      // if (account?.provider === "google") {
      //   const email = token.email;
      //   console.log(email)
      //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-user-info?email=${email}`);
      //   const data = await res.json();
      //   token.user = data.user;
      // }