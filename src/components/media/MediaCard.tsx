import Link from "next/link";
import { Film, Subtitles, Video } from "lucide-react";
import { formatRelativeTimeVi, getTmdbImageUrl } from "@/lib/utils";
import { getProviderStyle } from "@/lib/links/provider-detector";

export interface MediaCardItem {
  id: string;
  slug: string;
  type: "MOVIE" | "TV" | "ANIME";
  title: string;
  originalTitle: string;
  releaseYear: number | null;
  posterPath: string | null;
  updatedAt: Date | string;
  providers: string[];
  hasSubtitle: boolean;
  hasRawMux: boolean;
  latestRelease: {
    title: string;
    releaseTag: string;
    createdAt: Date | string;
  } | null;
}

export function MediaCard({ item }: { item: MediaCardItem }) {
  const poster = getTmdbImageUrl(item.posterPath, "w342");
  const typeLabel =
    item.type === "MOVIE"
      ? "Phim lẻ"
      : item.type === "ANIME"
      ? "Anime"
      : "Phim bộ";

  return (
    <Link
      href={`/media/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#0e1422] transition hover:border-amber-500/50 hover:bg-[#121a2b]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-700">
            <Film className="h-10 w-10" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-2.5">
          <span className="rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-slate-200 backdrop-blur-sm">
            {typeLabel}
          </span>
          {item.releaseYear && (
            <span className="rounded-md bg-black/70 px-2 py-0.5 font-mono text-[11px] text-amber-300 backdrop-blur-sm">
              {item.releaseYear}
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex gap-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-6">
          {item.hasSubtitle && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-500/40">
              <Subtitles className="h-3 w-3" />
              Sub rời
            </span>
          )}
          {item.hasRawMux && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
              <Video className="h-3 w-3" />
              Raw Mux
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-white group-hover:text-amber-300">
            {item.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
            {item.originalTitle}
          </p>
        </div>

        <div className="mt-3 space-y-2">
          {item.latestRelease && (
            <p className="line-clamp-1 rounded bg-slate-900/90 px-2 py-1 font-mono text-[11px] text-slate-300">
              {item.latestRelease.releaseTag}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap gap-1">
              {item.providers.slice(0, 3).map((provider) => {
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
            <span className="text-[10px] text-slate-500">
              {formatRelativeTimeVi(item.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
