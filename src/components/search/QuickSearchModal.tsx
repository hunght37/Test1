"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Film, Loader2, Search, X } from "lucide-react";
import { getTmdbImageUrl } from "@/lib/utils";
import { getProviderStyle } from "@/lib/links/provider-detector";

interface QuickSearchItem {
  id: string;
  slug: string;
  type: "MOVIE" | "TV" | "ANIME";
  title: string;
  originalTitle: string;
  releaseYear: number | null;
  posterPath: string | null;
  providers: string[];
  hasSubtitle: boolean;
  hasRawMux: boolean;
}

export function QuickSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<QuickSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 20);
    } else {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=10`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = (await res.json()) as { items: QuickSearchItem[] };
          setItems(data.items ?? []);
          setActiveIndex(0);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  if (!open) return null;

  const navigateTo = (slug: string) => {
    onClose();
    router.push(`/media/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (items.length ? (prev + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        items.length ? (prev - 1 + items.length) % items.length : 0
      );
    } else if (e.key === "Enter" && items[activeIndex]) {
      e.preventDefault();
      navigateTo(items[activeIndex].slug);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 pt-16 backdrop-blur-sm sm:pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0f1624] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5">
          <Search className="h-5 w-5 shrink-0 text-amber-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gõ tên phim (có dấu, không dấu hoặc tiếng Anh)..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none sm:text-base"
          />
          {loading && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {items.length === 0 && !loading ? (
            <div className="py-10 text-center text-sm text-slate-400">
              {query
                ? `Không tìm thấy phim nào khớp với "${query}".`
                : "Nhập tên phim để tìm nhanh link SubDL, SubSource hoặc Raw Mux."}
            </div>
          ) : (
            <ul className="space-y-1">
              {items.map((item, idx) => {
                const poster = getTmdbImageUrl(item.posterPath, "w185");
                const isActive = idx === activeIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => navigateTo(item.slug)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition ${
                        isActive
                          ? "bg-amber-500/15 ring-1 ring-amber-500/40"
                          : "hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-slate-800">
                        {poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={poster}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-600">
                            <Film className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-white">
                            {item.title}
                          </span>
                          {item.releaseYear && (
                            <span className="shrink-0 text-xs text-slate-400">
                              ({item.releaseYear})
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-400">
                          {item.originalTitle} ·{" "}
                          {item.type === "MOVIE"
                            ? "Phim lẻ"
                            : item.type === "ANIME"
                            ? "Anime"
                            : "Phim bộ"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {item.providers.slice(0, 4).map((provider) => {
                            const style = getProviderStyle(provider);
                            return (
                              <span
                                key={provider}
                                className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${style.badgeClass}`}
                              >
                                {style.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/60 px-4 py-2 text-[11px] text-slate-500">
          <span>↑↓ di chuyển · Enter mở phim · Esc đóng</span>
          <span>Hỗ trợ tìm không dấu</span>
        </div>
      </div>
    </div>
  );
}
