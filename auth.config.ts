
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { jwtDecode } from 'jwt-decode'

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

// Extendemos el User para que tenga los datos que vienen del token
interface ExtendedUser extends User {
  id: string;
  email: string;
  role: string;
  name?: string;
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
      if (user && account?.provider === "credentials") {
        const { token: accessToken, ...userInfo } = user as any;
        token.user = userInfo;
        token.accessToken = accessToken;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = token.user as ExtendedUser;
      (session as any).accessToken = token.accessToken;
      return session;
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