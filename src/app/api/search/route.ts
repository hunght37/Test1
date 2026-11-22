import { NextResponse } from "next/server";
import { LinkCategory, MediaType } from "@prisma/client";
import { searchMediaCatalog } from "@/lib/search/query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const typeParam = searchParams.get("type")?.toUpperCase() ?? "ALL";
  const categoryParam = searchParams.get("category")?.toUpperCase() ?? "ALL";
  const limitParam = Number(searchParams.get("limit") ?? "20");

  const validTypes = new Set(["MOVIE", "TV", "ANIME", "ALL"]);
  const validCategories = new Set(["SUBTITLE", "RAW_MUX", "ALL"]);

  const type = validTypes.has(typeParam)
    ? (typeParam as MediaType | "ALL")
    : "ALL";
  const category = validCategories.has(categoryParam)
    ? (categoryParam as LinkCategory | "ALL")
    : "ALL";

  try {
    const items = await searchMediaCatalog({
      q,
      type,
      category,
      limit: Number.isFinite(limitParam) ? limitParam : 20,
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { items: [], error: "Không thể truy vấn cơ sở dữ liệu." },
      { status: 500 }
    );
  }
}
