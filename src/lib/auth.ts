/**
 * Admin authentication helpers (JWT).
 * Verifies token from cookie or Authorization header.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "mamas-kitchen-dev-secret-change-in-production"
);
const COOKIE_NAME = "mamas_admin_token";
const MAX_AGE = 60 * 60 * 24; // 24 hours

export interface AdminPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function getAdminFromCookie(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getAuthCookieName(): string {
  return COOKIE_NAME;
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** True if the string looks like a phone number (digits, optional + prefix). */
function isPhoneLike(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

/** Normalize phone to digits; e.g. 0771234567 -> 94771234567 */
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return "94" + digits.slice(1);
  return digits;
}

/**
 * Validate admin credentials and return user if valid.
 * Login with email or phone (admin can use either).
 * Throws on database errors so the login route can return a clear message.
 */
export async function validateAdmin(
  emailOrPhone: string,
  password: string
): Promise<{ id: string; email: string } | null> {
  const trimmed = emailOrPhone.trim();
  if (!trimmed) return null;
  let user: { id: string; email: string; passwordHash: string; role: string; phone: string | null } | null = null;
  try {
    if (isPhoneLike(trimmed)) {
      const phoneNorm = normalizePhone(trimmed);
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phoneNorm },
            { phone: trimmed.replace(/\D/g, "") },
          ],
        },
      });
    } else {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: trimmed },
            { phone: trimmed },
          ],
        },
      });
    }
  } catch (err) {
    console.error("validateAdmin DB error:", err);
    throw err;
  }
  if (!user || user.role !== "ADMIN") return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email };
}
