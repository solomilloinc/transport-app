import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { nextAuthOptions } from "@/auth.config";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const refreshToken = typeof token?.refreshToken === "string" ? token.refreshToken : null;
    const response = await fetch(`${process.env.BACKEND_URL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(refreshToken ? { Cookie: `refreshToken=${encodeURIComponent(refreshToken)}` } : {}),
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
    });

    return NextResponse.json({
      success: response.ok,
      message: "Logout successful",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
