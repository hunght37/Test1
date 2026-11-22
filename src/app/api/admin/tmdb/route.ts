import { NextResponse } from "next/server";
import { MediaType } from "@prisma/client";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { searchTmdb } from "@/lib/tmdb/client";
import { createManualMedia, syncMediaFromTmdb } from "@/lib/tmdb/sync";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTmdb(q);
    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi gọi TMDB API.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

const importSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("tmdb"),
    tmdbId: z.number().int().positive(),
    kind: z.enum(["movie", "tv"]),
    overrideType: z.nativeEnum(MediaType).optional(),
    altTitles: z.string().trim().optional(),
  }),
  z.object({
    mode: z.literal("manual"),
    type: z.nativeEnum(MediaType),
    title: z.string().trim().min(1),
    originalTitle: z.string().trim().min(1),
    altTitles: z.string().trim().optional(),
    releaseYear: z.number().int().min(1900).max(2100).nullable().optional(),
    overview: z.string().trim().optional(),
  }),
]);

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Thiếu thông tin phim.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const media =
      parsed.data.mode === "tmdb"
        ? await syncMediaFromTmdb(parsed.data)
        : await createManualMedia(parsed.data);

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể lưu phim.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
