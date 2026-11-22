import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "subviet_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 ngày

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.ADMIN_SESSION_SECRET);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  }
  if (env.ADMIN_PASSWORD) {
    return password === env.ADMIN_PASSWORD;
  }
  return false;
}

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(
  token: string
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminSessionToken(token);
}

export function getAdminCookieOptions() {
  return {
    name: ADMIN_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
