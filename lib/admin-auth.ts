import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "home_report_admin";

export function authIsDisabled() {
  return process.env.ADMIN_AUTH_DISABLED === "true";
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "development" ? "demo1234" : "");
}

function sessionSecret() {
  return process.env.SESSION_SECRET || (process.env.NODE_ENV === "development" ? "local-preview-session-secret" : "");
}

function token() {
  const password = adminPassword();
  const secret = sessionSecret();
  if (!password || !secret) return "";
  return createHmac("sha256", secret).update(password).digest("hex");
}

export function authIsConfigured() {
  return Boolean(adminPassword() && sessionSecret());
}

export function verifyPassword(input: string) {
  const expected = Buffer.from(adminPassword());
  const received = Buffer.from(input);
  return expected.length > 0 && expected.length === received.length && timingSafeEqual(expected, received);
}

export async function isAdmin() {
  if (authIsDisabled()) return true;
  const expected = token();
  if (!expected) return false;
  const current = (await cookies()).get(ADMIN_COOKIE)?.value || "";
  const expectedBuffer = Buffer.from(expected);
  const currentBuffer = Buffer.from(current);
  return expectedBuffer.length === currentBuffer.length && timingSafeEqual(expectedBuffer, currentBuffer);
}

export function adminSessionToken() {
  return token();
}
