/**
 * Get current admin session (for protecting admin routes).
 */

import { NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";

export async function GET() {
  const payload = await getAdminFromCookie();
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    email: payload.email,
  });
}
