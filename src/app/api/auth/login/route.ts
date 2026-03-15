/**
 * Admin login: validate credentials and set JWT cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateAdmin, createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };
    const emailOrPhone = (email ?? "").toString().trim();
    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { error: "Email or phone and password required" },
        { status: 400 }
      );
    }
    const user = await validateAdmin(emailOrPhone, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    const token = await createToken({
      sub: user.id,
      email: user.email,
      role: "ADMIN",
    });
    await setAuthCookie(token);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Login error:", e);
    const isDbError =
      e && typeof e === "object" && "code" in e &&
      (String((e as { code?: string }).code).startsWith("P") || (e as { name?: string }).name === "PrismaClientInitializationError");
    return NextResponse.json(
      {
        error: isDbError
          ? "Database connection failed. Check DATABASE_URL and run: npx prisma db push && npm run db:seed"
          : "Login failed",
      },
      { status: 500 }
    );
  }
}
