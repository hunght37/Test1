"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Film,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  detectLinkProvider,
  getProviderStyle,
  type LinkCategoryType,
} from "@/lib/links/provider-detector";
import { formatEpisodeCode, getTmdbImageUrl } from "@/lib/utils";

export interface PublishMediaOption {
  id: string;
  slug: string;
  type: "MOVIE" | "TV" | "ANIME";
  title: string;
  originalTitle: string;
  releaseYear: number | null;
  posterPath: string | null;
  episodes: Array<{
    id: string;
    seasonNumber: number;
    episodeNumber: number;
    title: string | null;
  }>;
}

interface TmdbResult {
  tmdbId: number;
  mediaType: "movie" | "tv";
  suggestedKind: "MOVIE" | "TV" | "ANIME";
  title: string;
  originalTitle: string;
  releaseYear: number | null;
  posterPath: string | null;
}

interface LinkDraft {
  id: string;
  url: string;
  category?: LinkCategoryType;
  quality: string;
  fileSizeText: string;
}

export function QuickPublishClient({
  initialSelectedMedia,
  recentMedia,
  siteUrl,
}: {
  initialSelectedMedia: PublishMediaOption | null;
  recentMedia: PublishMediaOption[];
  siteUrl: string;
}) {
  const [selectedMedia, setSelectedMedia] = useState<PublishMediaOption | null>(
    initialSelectedMedia
  );
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbResult[]>([]);
  const [searchingTmdb, setSearchingTmdb] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual media state (fallback nếu chưa có TMDB_API_KEY)
  const [manualTitle, setManualTitle] = useState("");
  const [manualOriginalTitle, setManualOriginalTitle] = useState("");
  const [manualYear, setManualYear] = useState("");
  const [manualType, setManualType] = useState<"MOVIE" | "TV" | "ANIME">("MOVIE");

  // Release form state
  const [episodeMode, setEpisodeMode] = useState<"existing" | "new" | "none">(
    initialSelectedMedia?.type === "MOVIE" ? "none" : "existing"
  );
  const [episodeId, setEpisodeId] = useState<string>("");
  const [seasonNumber, setSeasonNumber] = useState("1");
  const [episodeNumber, setEpisodeNumber] = useState("1");
  const [releaseTitle, setReleaseTitle] = useState(
    initialSelectedMedia?.type === "MOVIE" ? "Full Movie WEB-DL" : "Tập 01 - WEB-DL"
  );
  const [releaseTag, setReleaseTag] = useState("1080p.WEB-DL.DDP5.1");
  const [language, setLanguage] = useState<"VI" | "VI_EN">("VI");
  const [notes, setNotes] = useState("");

  const [links, setLinks] = useState<LinkDraft[]>([
    { id: "1", url: "", quality: "SRT", fileSizeText: "" },
    { id: "2", url: "", quality: "1080p WEB-DL", fileSizeText: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [publishedInfo, setPublishedInfo] = useState<{
    slug: string;
    shareText: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const selectMedia = (media: PublishMediaOption) => {
    setSelectedMedia(media);
    setPublishedInfo(null);
    setError("");
    if (media.type === "MOVIE") {
      setEpisodeMode("none");
      setReleaseTitle("Full Movie WEB-DL");
    } else if (media.episodes.length > 0) {
      setEpisodeMode("existing");
      setEpisodeId(media.episodes[0].id);
      setReleaseTitle(
        `Tập ${String(media.episodes[0].episodeNumber).padStart(2, "0")} - WEB-DL`
      );
    } else {
      setEpisodeMode("new");
      setReleaseTitle("Tập 01 - WEB-DL");
    }
  };

  const handleSearchTmdb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbQuery.trim()) return;
    setSearchingTmdb(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/tmdb?q=${encodeURIComponent(tmdbQuery.trim())}`
      );
      const data = (await res.json()) as {
        results?: TmdbResult[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Không thể tìm trên TMDB.");
        return;
      }
      setTmdbResults(data.results ?? []);
    } finally {
      setSearchingTmdb(false);
    }
  };

  const handleImportTmdb = async (item: TmdbResult) => {
    setImportingId(item.tmdbId);
    setError("");
    try {
      const res = await fetch("/api/admin/tmdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tmdb",
          tmdbId: item.tmdbId,
          kind: item.mediaType,
          overrideType: item.suggestedKind,
        }),
      });
      const data = (await res.json()) as {
        media?: PublishMediaOption;
        error?: string;
      };
      if (!res.ok || !data.media) {
        setError(data.error || "Lỗi import phim từ TMDB.");
        return;
      }
      selectMedia(data.media);
      setTmdbResults([]);
    } finally {
      setImportingId(null);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/tmdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          type: manualType,
          title: manualTitle,
          originalTitle: manualOriginalTitle || manualTitle,
          releaseYear: manualYear ? Number(manualYear) : null,
        }),
      });
      const data = (await res.json()) as {
        media?: PublishMediaOption;
        error?: string;
      };
      if (!res.ok || !data.media) {
        setError(data.error || "Không thể tạo phim.");
        return;
      }
      selectMedia({ ...data.media, episodes: data.media.episodes ?? [] });
      setShowManualForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const addLinkRow = () => {
    setLinks((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        url: "",
        quality: "1080p WEB-DL",
        fileSizeText: "",
      },
    ]);
  };

  const updateLinkRow = (id: string, patch: Partial<LinkDraft>) => {
    setLinks((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const removeLinkRow = (id: string) => {
    setLinks((prev) => prev.filter((row) => row.id !== id));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedia) return;

    const validLinks = links.filter((l) => l.url.trim().length > 0);
    if (validLinks.length === 0) {
      setError("Vui lòng dán ít nhất 1 link SubDL, SubSource hoặc Raw Mux.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        mediaId: selectedMedia.id,
        episodeId:
          episodeMode === "existing" && episodeId ? episodeId : undefined,
        seasonNumber:
          episodeMode === "new" ? Number(seasonNumber) : undefined,
        episodeNumber:
          episodeMode === "new" ? Number(episodeNumber) : undefined,
        title: releaseTitle,
        releaseTag,
        language,
        notes: notes.trim() || undefined,
        links: validLinks.map((l) => ({
          url: l.url.trim(),
          category: l.category,
          quality: l.quality.trim() || undefined,
          fileSizeText: l.fileSizeText.trim() || undefined,
        })),
      };

      const res = await fetch("/api/admin/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        media?: { slug: string; title: string };
      };
      if (!res.ok) {
        setError(data.error || "Xuất bản thất bại.");
        return;
      }

      const cleanBase = siteUrl.replace(/\/$/, "");
      const movieUrl = `${cleanBase}/media/${selectedMedia.slug}`;
      const shareText = [
        `[Vietsub WEB-DL + Raw Mux] ${selectedMedia.title}${
          selectedMedia.releaseYear ? ` (${selectedMedia.releaseYear})` : ""
        }`,
        `Phiên bản: ${releaseTitle} | ${releaseTag}`,
        `Link tải SubDL / SubSource & Raw: ${movieUrl}`,
      ].join("\n");

      setPublishedInfo({ slug: selectedMedia.slug, shareText });
      setLinks([
        { id: String(Date.now()), url: "", quality: "SRT", fileSizeText: "" },
        {
          id: String(Date.now() + 1),
          url: "",
          quality: "1080p WEB-DL",
          fileSizeText: "",
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyShare = async () => {
    if (!publishedInfo) return;
    await navigator.clipboard.writeText(publishedInfo.shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">
          Đăng nhanh Link SubDL / SubSource & Raw Mux
        </h1>
        <p className="text-sm text-slate-400">
          Kéo thông tin phim từ TMDB trong 1 click, sau đó dán các link vào là
          xong.
        </p>
      </div>

      {/* Step 1: Select or Import Movie */}
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-[#0d1422] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
            Bước 1: Chọn Phim / Series
          </h2>
          <button
            type="button"
            onClick={() => setShowManualForm((v) => !v)}
            className="text-xs text-slate-400 underline hover:text-white"
          >
            {showManualForm
              ? "Đóng nhập thủ công"
              : "Hoặc tự nhập phim không qua TMDB"}
          </button>
        </div>

        {selectedMedia ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5">
            <div className="flex items-center gap-3">
              {selectedMedia.posterPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getTmdbImageUrl(selectedMedia.posterPath, "w185")!}
                  alt={selectedMedia.title}
                  className="h-14 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-14 w-10 items-center justify-center rounded bg-slate-800">
                  <Film className="h-4 w-4 text-slate-500" />
                </div>
              )}
              <div>
                <p className="font-semibold text-white">
                  {selectedMedia.title}{" "}
                  {selectedMedia.releaseYear && (
                    <span className="text-xs text-slate-400">
                      ({selectedMedia.releaseYear})
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedMedia.originalTitle} · {selectedMedia.type}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMedia(null)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Đổi phim khác
            </button>
          </div>
        ) : (
          <>
            {showManualForm ? (
              <form
                onSubmit={handleCreateManual}
                className="grid gap-3 rounded-xl border border-slate-800 bg-[#080c15] p-4 sm:grid-cols-2"
              >
                <input
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Tên tiếng Việt..."
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                />
                <input
                  value={manualOriginalTitle}
                  onChange={(e) => setManualOriginalTitle(e.target.value)}
                  placeholder="Tên gốc / tiếng Anh..."
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                />
                <input
                  type="number"
                  value={manualYear}
                  onChange={(e) => setManualYear(e.target.value)}
                  placeholder="Năm phát hành (vd: 2025)"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                />
                <select
                  value={manualType}
                  onChange={(e) =>
                    setManualType(e.target.value as "MOVIE" | "TV" | "ANIME")
                  }
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                >
                  <option value="MOVIE">Phim lẻ</option>
                  <option value="TV">Phim bộ</option>
                  <option value="ANIME">Anime</option>
                </select>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                  >
                    Tạo & Chọn phim này
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleSearchTmdb} className="flex gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-[#080c15] px-3">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={tmdbQuery}
                      onChange={(e) => setTmdbQuery(e.target.value)}
                      placeholder="Gõ tên phim trên TMDB hoặc dán link themoviedb.org/..."
                      className="w-full bg-transparent py-2.5 text-sm text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searchingTmdb}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                  >
                    {searchingTmdb && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Tìm TMDB
                  </button>
                </form>

                {tmdbResults.length > 0 && (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {tmdbResults.map((item) => (
                      <div
                        key={`${item.mediaType}-${item.tmdbId}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#080c15] p-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          {item.posterPath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getTmdbImageUrl(item.posterPath, "w185")!}
                              alt={item.title}
                              className="h-12 w-8 shrink-0 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-slate-800">
                              <Film className="h-3.5 w-3.5 text-slate-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {item.title}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {item.originalTitle} ·{" "}
                              {item.releaseYear ?? "?"} · {item.suggestedKind}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={importingId === item.tmdbId}
                          onClick={() => handleImportTmdb(item)}
                          className="shrink-0 rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/30"
                        >
                          {importingId === item.tmdbId ? "Đang kéo..." : "Chọn"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {recentMedia.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium text-slate-400">
                      Hoặc chọn nhanh phim đã có trên web:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentMedia.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => selectMedia(m)}
                          className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-500/50 hover:text-white"
                        >
                          {m.title} {m.releaseYear ? `(${m.releaseYear})` : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Step 2: Release & Links */}
      {selectedMedia && (
        <form
          onSubmit={handlePublish}
          className="space-y-5 rounded-2xl border border-slate-800 bg-[#0d1422] p-5"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
            Bước 2: Nhập thông tin bản phát hành & Dán Link
          </h2>

          {selectedMedia.type !== "MOVIE" && (
            <div className="space-y-3 rounded-xl border border-slate-800 bg-[#080c15] p-4">
              <div className="flex flex-wrap gap-3 text-xs">
                <label className="flex cursor-pointer items-center gap-1.5 text-slate-300">
                  <input
                    type="radio"
                    checked={episodeMode === "existing"}
                    onChange={() => setEpisodeMode("existing")}
                    disabled={selectedMedia.episodes.length === 0}
                  />
                  Chọn tập từ TMDB ({selectedMedia.episodes.length} tập)
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-slate-300">
                  <input
                    type="radio"
                    checked={episodeMode === "new"}
                    onChange={() => setEpisodeMode("new")}
                  />
                  Nhập số Mùa / Tập thủ công
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-slate-300">
                  <input
                    type="radio"
                    checked={episodeMode === "none"}
                    onChange={() => setEpisodeMode("none")}
                  />
                  Trọn bộ (Full Season)
                </label>
              </div>

              {episodeMode === "existing" && selectedMedia.episodes.length > 0 && (
                <select
                  value={episodeId}
                  onChange={(e) => {
                    setEpisodeId(e.target.value);
                    const ep = selectedMedia.episodes.find(
                      (x) => x.id === e.target.value
                    );
                    if (ep) {
                      setReleaseTitle(
                        `Tập ${String(ep.episodeNumber).padStart(2, "0")} - WEB-DL`
                      );
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                >
                  {selectedMedia.episodes.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      {formatEpisodeCode(ep.seasonNumber, ep.episodeNumber)} —{" "}
                      {ep.title || `Tập ${ep.episodeNumber}`}
                    </option>
                  ))}
                </select>
              )}

              {episodeMode === "new" && (
                <div className="flex gap-3">
                  <div className="w-32">
                    <label className="mb-1 block text-xs text-slate-400">
                      Mùa (Season)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={seasonNumber}
                      onChange={(e) => setSeasonNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none"
                    />
                  </div>
                  <div className="w-32">
                    <label className="mb-1 block text-xs text-slate-400">
                      Tập (Episode)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={episodeNumber}
                      onChange={(e) => {
                        setEpisodeNumber(e.target.value);
                        setReleaseTitle(
                          `Tập ${String(e.target.value).padStart(2, "0")} - WEB-DL`
                        );
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Tiêu đề hiển thị
              </label>
              <input
                required
                value={releaseTitle}
                onChange={(e) => setReleaseTitle(e.target.value)}
                placeholder="Vd: Tập 01 - WEB-DL"
                className="w-full rounded-xl border border-slate-700 bg-[#080c15] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Tên bản Release (Sync WEB-DL)
              </label>
              <input
                required
                value={releaseTag}
                onChange={(e) => setReleaseTag(e.target.value)}
                placeholder="Vd: 1080p.NF.WEB-DL.DDP5.1"
                className="w-full rounded-xl border border-slate-700 bg-[#080c15] px-3 py-2 font-mono text-sm text-amber-300 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Ngôn ngữ phụ đề
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "VI" | "VI_EN")}
                className="w-full rounded-xl border border-slate-700 bg-[#080c15] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              >
                <option value="VI">Thuần Việt</option>
                <option value="VI_EN">Song ngữ Việt - Anh</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Ghi chú cho người xem (tùy chọn)
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vd: Khớp mọi bản NF/AMZN WEB-DL, bản Raw đã mux softsub ASS..."
              className="w-full rounded-xl border border-slate-700 bg-[#080c15] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>

          {/* Dynamic Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Danh sách Link (Dán URL tự nhận diện SubDL / SubSource / Drive / Gofile...)
              </label>
              <button
                type="button"
                onClick={addLinkRow}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm dòng link
              </button>
            </div>

            <div className="space-y-2.5">
              {links.map((row) => {
                const detected = row.url.trim()
                  ? detectLinkProvider(row.url)
                  : null;
                const badgeStyle = detected
                  ? getProviderStyle(detected.provider)
                  : null;

                return (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-[#080c15] p-2.5"
                  >
                    <input
                      type="url"
                      value={row.url}
                      onChange={(e) =>
                        updateLinkRow(row.id, { url: e.target.value })
                      }
                      placeholder="https://subdl.com/... hoặc https://drive.google.com/..."
                      className="min-w-[240px] flex-1 bg-transparent px-2 py-1 text-sm text-white placeholder-slate-500 outline-none"
                    />

                    {badgeStyle && detected && (
                      <span
                        className={`rounded border px-2 py-0.5 text-[11px] font-medium ${badgeStyle.badgeClass}`}
                      >
                        {detected.category === "SUBTITLE" ? "Sub" : "Raw"}:{" "}
                        {badgeStyle.label}
                      </span>
                    )}

                    <input
                      type="text"
                      value={row.quality}
                      onChange={(e) =>
                        updateLinkRow(row.id, { quality: e.target.value })
                      }
                      placeholder="Chất lượng (1080p / SRT)"
                      className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 outline-none"
                    />

                    <input
                      type="text"
                      value={row.fileSizeText}
                      onChange={(e) =>
                        updateLinkRow(row.id, { fileSizeText: e.target.value })
                      }
                      placeholder="Dung lượng (2.1 GB)"
                      className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 outline-none"
                    />

                    {links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLinkRow(row.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu & Xuất bản ngay
            </button>
          </div>
        </form>
      )}

      {/* Share Box after Publish */}
      {publishedInfo && (
        <section className="space-y-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-emerald-300">
              Đã xuất bản thành công!
            </p>
            <div className="flex gap-2">
              <Link
                href={`/media/${publishedInfo.slug}`}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Xem trang phim →
              </Link>
              <button
                type="button"
                onClick={handleCopyShare}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-slate-900 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-slate-800"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Đã copy!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy bài đăng Facebook / Telegram
                  </>
                )}
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-950/70 p-3 font-mono text-xs text-slate-200">
            {publishedInfo.shareText}
          </pre>
        </section>
      )}
    </div>
  );
}
