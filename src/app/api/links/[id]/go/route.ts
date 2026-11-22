import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidHttpUrl } from "@/lib/links/provider-detector";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const link = await db.externalLink.findUnique({
    where: { id },
    select: { id: true, url: true },
  });

  if (!link || !isValidHttpUrl(link.url)) {
    return NextResponse.json(
      { error: "Link không tồn tại hoặc không hợp lệ." },
      { status: 404 }
    );
  }

  await db.externalLink
    .update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    })
    .catch((err) => console.error("Increment click error:", err));

  return NextResponse.redirect(link.url, 302);
}
