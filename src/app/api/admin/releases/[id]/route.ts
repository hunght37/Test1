import { NextResponse } from "next/server";
import { ReleaseLanguage } from "@prisma/client";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";

const updateReleaseSchema = z.object({
  title: z.string().trim().min(1).optional(),
  releaseTag: z.string().trim().min(1).optional(),
  language: z.nativeEnum(ReleaseLanguage).optional(),
  notes: z.string().trim().nullable().optional(),
  isPublished: z.boolean().optional(),
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

  const parsed = updateReleaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const updated = await db.releaseEntry.update({
    where: { id },
    data: parsed.data,
    include: { links: true },
  });

  return NextResponse.json({ release: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await db.releaseEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
