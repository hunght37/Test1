import Link from "next/link";
import { LinkCategory, MediaType } from "@prisma/client";
import { Film, Search, Sparkles, Subtitles, Video } from "lucide-react";
import { searchMediaCatalog } from "@/lib/search/query";
import { MediaCard } from "@/components/media/MediaCard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; category?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const typeParam = params.type?.toUpperCase() ?? "ALL";
  const categoryParam = params.category?.toUpperCase() ?? "ALL";

  const validTypes = new Set(["ALL", "MOVIE", "TV", "ANIME"]);
  const validCategories = new Set(["ALL", "SUBTITLE", "RAW_MUX"]);

  const selectedType = (
    validTypes.has(typeParam) ? typeParam : "ALL"
  ) as MediaType | "ALL";
  const selectedCategory = (
    validCategories.has(categoryParam) ? categoryParam : "ALL"
  ) as LinkCategory | "ALL";

  let items: Awaited<ReturnType<typeof searchMediaCatalog>> = [];
  let dbError = false;

  try {
    items = await searchMediaCatalog({
      q,
      type: selectedType,
      category: selectedCategory,
      limit: 36,
    });
  } catch {
    dbError = true;
  }

  const buildFilterHref = (next: {
    type?: string;
    category?: string;
    q?: string;
  }) => {
    const sp = new URLSearchParams();
    const nextQ = next.q !== undefined ? next.q : q;
    const nextType = next.type !== undefined ? next.type : selectedType;
    const nextCat =
      next.category !== undefined ? next.category : selectedCategory;

    if (nextQ) sp.set("q", nextQ);
    if (nextType && nextType !== "ALL") sp.set("type", nextType);
    if (nextCat && nextCat !== "ALL") sp.set("category", nextCat);
    const qs = sp.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="space-y-8">
      {/* Hero Search */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-[#111827] via-[#0d1320] to-[#0a0e18] p-6 sm:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            Tìm nhanh Sub Việt WEB-DL & Bản Raw Mux sẵn
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Tìm phụ đề tiếng Việt trong{" "}
            <span className="text-amber-400">3 giây</span>
          </h1>
          <p className="mt-2.5 text-sm text-slate-400 sm:text-base">
            Tổng hợp link phụ đề chuẩn WEB-DL trên{" "}
            <span className="text-amber-300">SubDL</span>,{" "}
            <span className="text-sky-300">SubSource</span> và link bản Raw đã
            mux sẵn Vietsub. Không quảng cáo, không cần đăng nhập.
          </p>

          <form action="/" method="GET" className="mt-6">
            {selectedType !== "ALL" && (
              <input type="hidden" name="type" value={selectedType} />
            )}
            {selectedCategory !== "ALL" && (
              <input type="hidden" name="category" value={selectedCategory} />
            )}
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/90 bg-[#070b13] p-1.5 shadow-lg focus-within:border-amber-500/70 focus-within:ring-2 focus-within:ring-amber-500/20">
              <Search className="ml-2.5 h-5 w-5 shrink-0 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Gõ tên phim (có dấu, không dấu, tên tiếng Anh hoặc mã IMDb)..."
                className="w-full bg-transparent px-2 py-2 text-sm text-white placeholder-slate-500 outline-none sm:text-base"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Tìm ngay
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: "ALL", label: "Tất cả" },
            { value: "MOVIE", label: "Phim lẻ" },
            { value: "TV", label: "Phim bộ" },
            { value: "ANIME", label: "Anime" },
          ].map((tab) => {
            const active = selectedType === tab.value;
            return (
              <Link
                key={tab.value}
                href={buildFilterHref({ type: tab.value })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                  active
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "border border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={buildFilterHref({
              category: selectedCategory === "SUBTITLE" ? "ALL" : "SUBTITLE",
            })}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              selectedCategory === "SUBTITLE"
                ? "border border-amber-500/60 bg-amber-500/20 text-amber-300"
                : "border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Subtitles className="h-3.5 w-3.5" />
            Có SubDL / SubSource
          </Link>

          <Link
            href={buildFilterHref({
              category: selectedCategory === "RAW_MUX" ? "ALL" : "RAW_MUX",
            })}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              selectedCategory === "RAW_MUX"
                ? "border border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                : "border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            Có Raw Mux sẵn
          </Link>
        </div>
      </section>

      {/* Catalog Grid */}
      <section>
        {q && (
          <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
            <span>
              Kết quả tìm kiếm cho{" "}
              <strong className="text-white">&ldquo;{q}&rdquo;</strong>:{" "}
              {items.length} phim
            </span>
            <Link
              href="/"
              className="text-xs text-amber-400 hover:underline"
            >
              Xóa bộ lọc
            </Link>
          </div>
        )}

        {dbError ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
            <p className="font-semibold text-amber-300">
              Chưa kết nối được PostgreSQL Database
            </p>
            <p className="mt-1.5 text-sm text-slate-300">
              Hãy cập nhật <code className="font-mono">DATABASE_URL</code> trong
              file <code className="font-mono">.env</code> và chạy{" "}
              <code className="font-mono">npx prisma db push</code> để khởi tạo
              bảng dữ liệu.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 py-16 text-center">
            <Film className="mb-3 h-10 w-10 text-slate-600" />
            <p className="text-base font-medium text-slate-300">
              {q
                ? "Không tìm thấy phim nào phù hợp"
                : "Chưa có phim nào được xuất bản"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {q
                ? "Thử tìm bằng tên tiếng Anh hoặc gõ không dấu ngắn gọn hơn."
                : "Đăng nhập trang Admin để kéo phim từ TMDB và gắn link SubDL / Raw Mux đầu tiên."}
            </p>
            {!q && (
              <Link
                href="/admin/publish"
                className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                Vào trang đăng phim
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
