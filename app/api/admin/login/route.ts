import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminSessionToken, authIsConfigured, authIsDisabled, verifyPassword } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  if (authIsDisabled()) return Response.json({ ok: true, authDisabled: true });
  if (!authIsConfigured()) {
    return Response.json({ error: "管理密碼尚未設定，請先設定伺服器環境變數。" }, { status: 503 });
  }
  const body = await request.json() as { password?: string };
  if (!body.password || !verifyPassword(body.password)) {
    return Response.json({ error: "密碼不正確" }, { status: 401 });
  }
  (await cookies()).set(ADMIN_COOKIE, adminSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}
