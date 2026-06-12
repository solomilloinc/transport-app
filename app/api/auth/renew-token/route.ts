import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const refreshToken = typeof token?.refreshToken === "string" ? token.refreshToken : null;
    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
    }

    const response = await fetch(`${process.env.BACKEND_URL}/renew-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${encodeURIComponent(refreshToken)}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Token refresh failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      token: data.token,
      refreshToken: data.refreshToken,
      success: true,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
