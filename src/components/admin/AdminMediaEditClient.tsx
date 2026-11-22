"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { formatEpisodeCode } from "@/lib/utils";
import { getProviderStyle } from "@/lib/links/provider-detector";

export interface AdminEditMediaDTO {
  id: string;
  slug: string;
  type: "MOVIE" | "TV" | "ANIME";
  title: string;
  originalTitle: string;
  altTitles: string | null;
  overview: string | null;
  isFeatured: boolean;
  releases: Array<{
    id: string;
    title: string;
    releaseTag: string;
    isPublished: boolean;
    episode: {
      seasonNumber: number;
      episodeNumber: number;
    } | null;
    links: Array<{
      id: string;
      category: "SUBTITLE" | "RAW_MUX";
      provider: string;
      url: string;
      quality: string | null;
      fileSizeText: string | null;
      isAlive: boolean;
      clickCount: number;
    }>;
  }>;
}

export function AdminMediaEditClient({
  media,
}: {
  media: AdminEditMediaDTO;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(media.title);
  const [originalTitle, setOriginalTitle] = useState(media.originalTitle);
  const [altTitles, setAltTitles] = useState(media.altTitles ?? "");
  const [type, setType] = useState(media.type);
  const [isFeatured, setIsFeatured] = useState(media.isFeatured);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [linkEdits, setLinkEdits] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const rel of media.releases) {
      for (const l of rel.links) {
        map[l.id] = l.url;
      }
    }
    return map;
  });

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch(`/api/admin/media/${media.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          originalTitle,
          altTitles: altTitles.trim() || null,
          type,
          isFeatured,
        }),
      });
      if (res.ok) {
        setSavedMsg("Đã lưu thông tin phim.");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedia = async () => {
    if (!confirm(`Xóa hoàn toàn "${media.title}" và toàn bộ link?`)) return;
    const res = await fetch(`/api/admin/media/${media.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    }
  };

  const handleDeleteRelease = async (releaseId: string) => {
    if (!confirm("Xóa bản phát hành này?")) return;
    const res = await fetch(`/api/admin/releases/${releaseId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    }
  };

  const handleUpdateLink = async (linkId: string, isAlive?: boolean) => {
    const url = linkEdits[linkId]?.trim();
    const res = await fetch(`/api/admin/links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(url ? { url } : {}),
        ...(isAlive !== undefined ? { isAlive } : {}),
      }),
    });
    if (res.ok) {
      router.refresh();
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Xóa link này?")) return;
    const res = await fetch(`/api/admin/links/${linkId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/media/${media.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            Xem trang công khai
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/admin/publish?mediaId=${media.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm tập / Link mới
          </Link>
        </div>
      </div>

      {/* Edit Metadata */}
      <form
        onSubmit={handleSaveMeta}
        className="space-y-4 rounded-2xl border border-slate-800 bg-[#0d1422] p-5"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Chỉnh sửa thông tin phim</h1>
          <button
            type="button"
            onClick={handleDeleteMedia}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa phim
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Tên tiếng Việt
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#080c15] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Tên gốc / tiếng Anh
            </label>
            <input
              required
              value={originalTitle}
              onChange={(e) => setOriginalTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#080c15] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Tên gọi khác / Tên lóng (giúp người xem tìm ra dễ hơn)
            </label>
            <input
              value={altTitles}
              onChange={(e) => setAltTitles(e.target.value)}
              placeholder="Vd: Nguoi Nhen 3, SpiderMan No Way Home"
              className="w-full rounded-xl border border-slate-700 bg-[#080c15] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-slate-400">Loại</label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "MOVIE" | "TV" | "ANIME")
                }
                className="w-full rounded-xl border border-slate-700 bg-[#080c15] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="MOVIE">Phim lẻ</option>
                <option value="TV">Phim bộ</option>
                <option value="ANIME">Anime</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              Ghim lên đầu
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          {savedMsg && <span className="text-xs text-emerald-400">{savedMsg}</span>}
        </div>
      </form>

      {/* Manage Releases & Links */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white">
          Các bản Release & Link hiện có ({media.releases.length})
        </h2>

        {media.releases.map((rel) => (
          <div
            key={rel.id}
            className="space-y-3 rounded-xl border border-slate-800 bg-[#0d1422] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {rel.episode && (
                  <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-xs text-sky-300">
                    {formatEpisodeCode(
                      rel.episode.seasonNumber,
                      rel.episode.episodeNumber
                    )}
                  </span>
                )}
                <span className="font-semibold text-white">{rel.title}</span>
                <span className="font-mono text-xs text-amber-300">
                  {rel.releaseTag}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteRelease(rel.id)}
                className="text-xs text-rose-400 hover:underline"
              >
                Xóa bản này
              </button>
            </div>

            <div className="space-y-2">
              {rel.links.map((link) => {
                const style = getProviderStyle(link.provider);
                return (
                  <div
                    key={link.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-[#080c15] p-2"
                  >
                    <span
                      className={`rounded border px-2 py-0.5 text-[11px] font-medium ${style.badgeClass}`}
                    >
                      {style.label}
                    </span>
                    <input
                      type="url"
                      value={linkEdits[link.id] ?? link.url}
                      onChange={(e) =>
                        setLinkEdits((prev) => ({
                          ...prev,
                          [link.id]: e.target.value,
                        }))
                      }
                      className="min-w-[220px] flex-1 bg-transparent px-2 py-1 font-mono text-xs text-slate-200 outline-none"
                    />
                    <span className="text-[11px] text-slate-500">
                      {link.clickCount} clicks
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateLink(link.id, true)}
                      className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
                    >
                      Lưu URL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateLink(link.id, !link.isAlive)}
                      className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      {link.isAlive ? "Đang sống" : "Đang chết (Bật lại)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
