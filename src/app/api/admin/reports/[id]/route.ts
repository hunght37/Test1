import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";

const reportActionSchema = z.object({
  isHandled: z.boolean(),
  markLinkDead: z.boolean().optional(),
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

  const parsed = reportActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const report = await db.brokenReport.update({
    where: { id },
    data: { isHandled: parsed.data.isHandled },
  });

  if (parsed.data.markLinkDead !== undefined) {
    await db.externalLink.update({
      where: { id: report.linkId },
      data: { isAlive: !parsed.data.markLinkDead },
    });
  }

  return NextResponse.json({ report });
}
