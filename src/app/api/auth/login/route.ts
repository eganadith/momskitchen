/**
 * Admin login: validate credentials and set JWT cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateAdmin, createToken, setAuthCookie } from "@/lib/auth";

function isDatabaseError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const name = (e as { name?: string }).name;
  const code = (e as { code?: string }).code;
  if (name === "PrismaClientInitializationError") return true;
  if (name === "PrismaClientKnownRequestError") return true;
  if (name === "PrismaClientUnknownRequestError") return true;
  if (typeof code === "string" && code.startsWith("P")) return true;
  return false;
}

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
    if (isDatabaseError(e)) {
      return NextResponse.json(
        {
          error:
            "Database error. Check: 1) DATABASE_URL in .env 2) Database is running 3) Run: npx prisma db push && npm run db:seed",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
