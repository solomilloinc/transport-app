import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { nextAuthOptions } from "@/auth.config";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const refreshToken = typeof token?.refreshToken === "string" ? token.refreshToken : null;
    const response = await fetch(`${process.env.BACKEND_URL}/revoke-all-sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        ...(refreshToken ? { Cookie: `refreshToken=${encodeURIComponent(refreshToken)}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to revoke sessions" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "All sessions revoked successfully",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
