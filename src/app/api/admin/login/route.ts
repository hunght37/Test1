import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createAdminSessionToken,
  getAdminCookieOptions,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const loginSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Thử sai quá nhiều lần. Vui lòng đợi 15 phút." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Vui lòng nhập mật khẩu." }, { status: 400 });
  }

  const valid = await verifyAdminPassword(parsed.data.password);
  if (!valid) {
    return NextResponse.json(
      { error: "Mật khẩu Admin không đúng." },
      { status: 401 }
    );
  }

  const token = await createAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    ...getAdminCookieOptions(),
    value: token,
  });
  return response;
}
