import { NextResponse } from "next/server";
import { MediaType } from "@prisma/client";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { buildMediaSearchText } from "@/lib/search/vietnamese";

const updateMediaSchema = z.object({
  title: z.string().trim().min(1).optional(),
  originalTitle: z.string().trim().min(1).optional(),
  altTitles: z.string().trim().nullable().optional(),
  type: z.nativeEnum(MediaType).optional(),
  isFeatured: z.boolean().optional(),
  overview: z.string().trim().nullable().optional(),
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

  const parsed = updateMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const existing = await db.mediaItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy phim" }, { status: 404 });
  }

  const nextTitle = parsed.data.title ?? existing.title;
  const nextOriginal = parsed.data.originalTitle ?? existing.originalTitle;
  const nextAlt =
    parsed.data.altTitles !== undefined
      ? parsed.data.altTitles
      : existing.altTitles;

  const updated = await db.mediaItem.update({
    where: { id },
    data: {
      ...parsed.data,
      searchNormalized: buildMediaSearchText({
        title: nextTitle,
        originalTitle: nextOriginal,
        altTitles: nextAlt,
        imdbId: existing.imdbId,
        releaseYear: existing.releaseYear,
      }),
    },
  });

  return NextResponse.json({ media: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await db.mediaItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
