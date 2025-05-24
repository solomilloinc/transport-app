// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { nextAuthOptions } from "@/auth.config";

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
