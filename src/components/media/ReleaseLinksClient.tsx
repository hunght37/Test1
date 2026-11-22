"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Subtitles,
  Video,
} from "lucide-react";
import { formatEpisodeCode, formatRelativeTimeVi } from "@/lib/utils";
import { getProviderStyle } from "@/lib/links/provider-detector";

export interface ReleaseLinkDTO {
  id: string;
  category: "SUBTITLE" | "RAW_MUX";
  provider: string;
  url: string;
  quality: string | null;
  fileSizeText: string | null;
  isAlive: boolean;
  clickCount: number;
}

export interface ReleaseEntryDTO {
  id: string;
  title: string;
  releaseTag: string;
  language: "VI" | "VI_EN";
  notes: string | null;
  createdAt: string;
  episode: {
    id: string;
    seasonNumber: number;
    episodeNumber: number;
    title: string | null;
  } | null;
  links: ReleaseLinkDTO[];
}

export function ReleaseLinksClient({
  releases,
  isSeries,
}: {
  releases: ReleaseEntryDTO[];
  isSeries: boolean;
}) {
  const seasons = useMemo(() => {
    const set = new Set<number>();
    for (const r of releases) {
      if (r.episode) set.add(r.episode.seasonNumber);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [releases]);

  const [selectedSeason, setSelectedSeason] = useState<number | "ALL">(
    seasons.length === 1 ? seasons[0] : "ALL"
  );
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | "ALL">(
    "ALL"
  );
  const [reportedIds, setReportedIds] = useState<Record<string, boolean>>({});
  const [reportingId, setReportingId] = useState<string | null>(null);

  const episodesInSeason = useMemo(() => {
    const map = new Map<
      string,
      { id: string; seasonNumber: number; episodeNumber: number }
    >();
    for (const r of releases) {
      if (
        r.episode &&
        (selectedSeason === "ALL" || r.episode.seasonNumber === selectedSeason)
      ) {
        map.set(r.episode.id, r.episode);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.seasonNumber !== b.seasonNumber
        ? a.seasonNumber - b.seasonNumber
        : a.episodeNumber - b.episodeNumber
    );
  }, [releases, selectedSeason]);

  const filteredReleases = useMemo(() => {
    return releases.filter((r) => {
      if (selectedSeason !== "ALL" && r.episode?.seasonNumber !== selectedSeason) {
        return false;
      }
      if (selectedEpisodeId !== "ALL" && r.episode?.id !== selectedEpisodeId) {
        return false;
      }
      return true;
    });
  }, [releases, selectedSeason, selectedEpisodeId]);

  const handleReportBroken = async (linkId: string) => {
    setReportingId(linkId);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkId,
          message: "Người xem báo link hỏng / không truy cập được",
        }),
      });
      if (res.ok) {
        setReportedIds((prev) => ({ ...prev, [linkId]: true }));
      }
    } finally {
      setReportingId(null);
    }
  };

  if (releases.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
        Phim này chưa có link phụ đề hoặc bản Raw nào được đăng.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Season & Episode quick selector for Series/Anime */}
      {isSeries && (seasons.length > 0 || episodesInSeason.length > 0) && (
        <div className="space-y-3 rounded-xl border border-slate-800/90 bg-[#0d1422] p-4">
          {seasons.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Mùa:</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedSeason("ALL");
                  setSelectedEpisodeId("ALL");
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  selectedSeason === "ALL"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Tất cả
              </button>
              {seasons.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSelectedSeason(s);
                    setSelectedEpisodeId("ALL");
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    selectedSeason === s
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Season {s}
                </button>
              ))}
            </div>
          )}

          {episodesInSeason.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-slate-400">
                Chọn tập:
              </span>
              <button
                type="button"
                onClick={() => setSelectedEpisodeId("ALL")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  selectedEpisodeId === "ALL"
                    ? "bg-sky-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Tất cả ({releases.length})
              </button>
              {episodesInSeason.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => setSelectedEpisodeId(ep.id)}
                  className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium transition ${
                    selectedEpisodeId === ep.id
                      ? "bg-sky-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {formatEpisodeCode(ep.seasonNumber, ep.episodeNumber)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Releases list */}
      <div className="space-y-4">
        {filteredReleases.map((release) => {
          const subtitleLinks = release.links.filter(
            (l) => l.category === "SUBTITLE"
          );
          const rawLinks = release.links.filter(
            (l) => l.category === "RAW_MUX"
          );

          return (
            <div
              key={release.id}
              className="rounded-xl border border-slate-800 bg-[#0e1524] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {release.episode && (
                      <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-sky-300 ring-1 ring-sky-500/40">
                        {formatEpisodeCode(
                          release.episode.seasonNumber,
                          release.episode.episodeNumber
                        )}
                      </span>
                    )}
                    <h3 className="text-base font-semibold text-white">
                      {release.title}
                    </h3>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                      {release.language === "VI_EN"
                        ? "Song ngữ Việt - Anh"
                        : "Thuần Việt"}
                    </span>
                  </div>

                  <p className="mt-1.5 font-mono text-xs text-amber-300/90">
                    {release.releaseTag}
                  </p>

                  {release.notes && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Ghi chú: {release.notes}
                    </p>
                  )}
                </div>

                <span className="text-xs text-slate-500">
                  {formatRelativeTimeVi(release.createdAt)}
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {/* Nhóm 1: Phụ đề rời (SubDL / SubSource) */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
                    <Subtitles className="h-3.5 w-3.5" />
                    Phụ đề rời WEB-DL
                  </div>
                  {subtitleLinks.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Chưa gắn link SubDL / SubSource.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {subtitleLinks.map((link) => {
                        const style = getProviderStyle(link.provider);
                        const reported = reportedIds[link.id];
                        return (
                          <div
                            key={link.id}
                            className="flex items-center gap-1"
                          >
                            <a
                              href={`/api/links/${link.id}/go`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                link.isAlive
                                  ? style.badgeClass
                                  : "border-red-900/60 bg-red-950/30 text-red-400 line-through"
                              }`}
                            >
                              <span>Tải trên {style.label}</span>
                              {link.quality && (
                                <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px]">
                                  {link.quality}
                                </span>
                              )}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              disabled={reported || reportingId === link.id}
                              onClick={() => handleReportBroken(link.id)}
                              title="Báo link hỏng"
                              className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-slate-500 transition hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-60"
                            >
                              {reported ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Nhóm 2: Link Raw đã Mux Vietsub */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    <Video className="h-3.5 w-3.5" />
                    Bản Raw đã Mux sẵn Vietsub
                  </div>
                  {rawLinks.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Chưa có link Raw mux sẵn cho bản này.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {rawLinks.map((link) => {
                        const style = getProviderStyle(link.provider);
                        const reported = reportedIds[link.id];
                        return (
                          <div
                            key={link.id}
                            className="flex items-center gap-1"
                          >
                            <a
                              href={`/api/links/${link.id}/go`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                link.isAlive
                                  ? style.badgeClass
                                  : "border-red-900/60 bg-red-950/30 text-red-400 line-through"
                              }`}
                            >
                              <span>{style.label}</span>
                              {link.quality && (
                                <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px]">
                                  {link.quality}
                                </span>
                              )}
                              {link.fileSizeText && (
                                <span className="text-[11px] opacity-80">
                                  · {link.fileSizeText}
                                </span>
                              )}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              disabled={reported || reportingId === link.id}
                              onClick={() => handleReportBroken(link.id)}
                              title="Báo link hỏng"
                              className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-slate-500 transition hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-60"
                            >
                              {reported ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
