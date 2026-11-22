"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  LogOut,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { formatRelativeTimeVi } from "@/lib/utils";

export interface AdminReportDTO {
  id: string;
  message: string | null;
  createdAt: string;
  link: {
    id: string;
    provider: string;
    url: string;
    isAlive: boolean;
    release: {
      title: string;
      media: {
        id: string;
        title: string;
        slug: string;
      };
    };
  };
}

export interface AdminMediaRowDTO {
  id: string;
  slug: string;
  title: string;
  originalTitle: string;
  type: "MOVIE" | "TV" | "ANIME";
  releaseYear: number | null;
  updatedAt: string;
  releaseCount: number;
  linkCount: number;
}

export function AdminDashboardClient({
  stats,
  initialReports,
  mediaRows,
}: {
  stats: {
    mediaCount: number;
    releaseCount: number;
    totalClicks: number;
    openReports: number;
  };
  initialReports: AdminReportDTO[];
  mediaRows: AdminMediaRowDTO[];
}) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [editingUrls, setEditingUrls] = useState<Record<string, string>>({});
  const [filterText, setFilterText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const handleDismissReport = async (reportId: string, markDead = false) => {
    setBusyId(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHandled: true, markLinkDead: markDead }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleReplaceLinkUrl = async (report: AdminReportDTO) => {
    const newUrl = editingUrls[report.id]?.trim();
    if (!newUrl) return;
    setBusyId(report.id);
    try {
      const res = await fetch(`/api/admin/links/${report.link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, isAlive: true }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== report.id));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  const filteredMedia = mediaRows.filter((m) => {
    const q = filterText.trim().toLowerCase();
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      m.originalTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản trị SubViet</h1>
          <p className="text-sm text-slate-400">
            Đăng nhanh link SubDL / SubSource, Raw Mux & xử lý báo lỗi link
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/publish"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Đăng phim / Link mới
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Thoát
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Tổng phim / series", value: stats.mediaCount },
          { label: "Bản phát hành", value: stats.releaseCount },
          { label: "Lượt bấm tải/mở link", value: stats.totalClicks },
          {
            label: "Báo link hỏng chờ xử lý",
            value: reports.length,
            highlight: reports.length > 0,
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-4 ${
              card.highlight
                ? "border-rose-500/40 bg-rose-500/10"
                : "border-slate-800 bg-[#0d1422]"
            }`}
          >
            <p className="text-xs text-slate-400">{card.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Broken Link Reports */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          Báo cáo Link hỏng ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0d1422] p-5 text-sm text-slate-400">
            Hiện chưa có báo cáo link hỏng nào.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-rose-500/30 bg-[#121622] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span>{report.link.release.media.title}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-amber-300">
                        {report.link.release.title}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                        {report.link.provider}
                      </span>
                    </div>
                    <a
                      href={report.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 break-all font-mono text-xs text-slate-400 hover:text-white"
                    >
                      {report.link.url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    {report.message && (
                      <p className="mt-1 text-xs text-rose-300">
                        Lý do: {report.message}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatRelativeTimeVi(report.createdAt)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="url"
                    value={editingUrls[report.id] ?? ""}
                    onChange={(e) =>
                      setEditingUrls((prev) => ({
                        ...prev,
                        [report.id]: e.target.value,
                      }))
                    }
                    placeholder="Dán link thay thế mới tại đây..."
                    className="min-w-[240px] flex-1 rounded-lg border border-slate-700 bg-[#080c15] px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    disabled={busyId === report.id || !editingUrls[report.id]}
                    onClick={() => handleReplaceLinkUrl(report)}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    Cập nhật link mới
                  </button>
                  <button
                    type="button"
                    disabled={busyId === report.id}
                    onClick={() => handleDismissReport(report.id, true)}
                    className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                  >
                    Đánh dấu link chết
                  </button>
                  <button
                    type="button"
                    disabled={busyId === report.id}
                    onClick={() => handleDismissReport(report.id, false)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Bỏ qua
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Media Catalog */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">
            Danh sách Phim đã đăng ({filteredMedia.length})
          </h2>
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#080c15] px-3 py-1.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Lọc nhanh tên phim..."
              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1422]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Phim / Series</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Số bản / Link</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredMedia.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{row.title}</div>
                    <div className="text-xs text-slate-400">
                      {row.originalTitle}
                      {row.releaseYear ? ` (${row.releaseYear})` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {row.type}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">
                    {row.releaseCount} bản · {row.linkCount} link
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {formatRelativeTimeVi(row.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/publish?mediaId=${row.id}`}
                        className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/25"
                      >
                        + Thêm tập/link
                      </Link>
                      <Link
                        href={`/admin/media/${row.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        <Pencil className="h-3 w-3" />
                        Sửa
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMedia.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Chưa có phim nào. Bấm &ldquo;Đăng phim / Link mới&rdquo; để bắt đầu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
