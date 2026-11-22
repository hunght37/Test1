import { NextResponse } from "next/server";
import { LinkCategory } from "@prisma/client";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  detectLinkProvider,
  isValidHttpUrl,
} from "@/lib/links/provider-detector";

const updateLinkSchema = z.object({
  url: z.string().trim().refine(isValidHttpUrl, "URL không hợp lệ").optional(),
  category: z.nativeEnum(LinkCategory).optional(),
  provider: z.string().trim().optional(),
  quality: z.string().trim().nullable().optional(),
  fileSizeText: z.string().trim().nullable().optional(),
  isAlive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu link không hợp lệ" }, { status: 400 });
  }

  const data = parsed.data;
  const detected = data.url ? detectLinkProvider(data.url) : null;

  const updated = await db.$transaction(async (tx) => {
    const link = await tx.externalLink.update({
      where: { id },
      data: {
        ...(data.url ? { url: data.url } : {}),
        ...(data.category
          ? { category: data.category }
          : detected
          ? { category: detected.category }
          : {}),
        ...(data.provider
          ? { provider: data.provider }
          : detected
          ? { provider: detected.provider }
          : {}),
        ...(data.quality !== undefined ? { quality: data.quality } : {}),
        ...(data.fileSizeText !== undefined
          ? { fileSizeText: data.fileSizeText }
          : {}),
        ...(data.isAlive !== undefined ? { isAlive: data.isAlive } : {}),
      },
    });

    if (data.url || data.isAlive === true) {
      await tx.brokenReport.updateMany({
        where: { linkId: id, isHandled: false },
        data: { isHandled: true },
      });
    }

    return link;
  });

  return NextResponse.json({ link: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await db.externalLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
