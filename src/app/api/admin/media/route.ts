import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { normalizeVietnameseSearch } from "@/lib/search/vietnamese";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const normalized = normalizeVietnameseSearch(q);

  const items = await db.mediaItem.findMany({
    where: normalized
      ? {
          searchNormalized: {
            contains: normalized,
            mode: "insensitive",
          },
        }
      : undefined,
    take: 20,
    orderBy: { updatedAt: "desc" },
    include: {
      episodes: {
        orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
      },
      _count: {
        select: { releases: true },
      },
    },
  });

  return NextResponse.json({ items });
}
