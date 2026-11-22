import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const reportSchema = z.object({
  linkId: z.string().min(1),
  message: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`report:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Thiếu thông tin link." }, { status: 400 });
  }

  const link = await db.externalLink.findUnique({
    where: { id: parsed.data.linkId },
    select: { id: true },
  });
  if (!link) {
    return NextResponse.json({ error: "Không tìm thấy link." }, { status: 404 });
  }

  await db.brokenReport.create({
    data: {
      linkId: link.id,
      message: parsed.data.message || "Người xem báo link hỏng / không tải được",
    },
  });

  return NextResponse.json({ ok: true });
}
