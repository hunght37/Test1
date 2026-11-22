import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Film, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getTmdbImageUrl } from "@/lib/utils";
import {
  ReleaseLinksClient,
  type ReleaseEntryDTO,
} from "@/components/media/ReleaseLinksClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const media = await db.mediaItem
    .findUnique({
      where: { slug },
      select: {
        title: true,
        originalTitle: true,
        releaseYear: true,
        overview: true,
        posterPath: true,
      },
    })
    .catch(() => null);

  if (!media) {
    return { title: "Không tìm thấy phim" };
  }

  const yearStr = media.releaseYear ? ` (${media.releaseYear})` : "";
  return {
    title: `Phụ đề Việt & Raw Mux: ${media.title}${yearStr}`,
    description:
      media.overview ||
      `Tìm nhanh link phụ đề tiếng Việt WEB-DL (SubDL, SubSource) và bản Raw đã mux Vietsub cho ${media.title} (${media.originalTitle}).`,
    openGraph: {
      title: `${media.title}${yearStr} — ${env.NEXT_PUBLIC_SITE_NAME}`,
      images: media.posterPath
        ? [getTmdbImageUrl(media.posterPath, "w500")!]
        : [],
    },
  };
}

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const isAdmin = await isAdminAuthenticated();

  const media = await db.mediaItem.findUnique({
    where: { slug },
    include: {
      releases: {
        where: { isPublished: true },
        orderBy: [
          { episode: { seasonNumber: "asc" } },
          { episode: { episodeNumber: "asc" } },
          { createdAt: "desc" },
        ],
        include: {
          episode: true,
          links: {
            orderBy: [{ category: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!media) {
    notFound();
  }

  const poster = getTmdbImageUrl(media.posterPath, "w500");
  const backdrop = getTmdbImageUrl(media.backdropPath, "w1280");

  const releasesDto: ReleaseEntryDTO[] = media.releases.map((r) => ({
    id: r.id,
    title: r.title,
    releaseTag: r.releaseTag,
    language: r.language,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    episode: r.episode
      ? {
          id: r.episode.id,
          seasonNumber: r.episode.seasonNumber,
          episodeNumber: r.episode.episodeNumber,
          title: r.episode.title,
        }
      : null,
    links: r.links.map((l) => ({
      id: l.id,
      category: l.category,
      provider: l.provider,
      url: l.url,
      quality: l.quality,
      fileSizeText: l.fileSizeText,
      isAlive: l.isAlive,
      clickCount: l.clickCount,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại tìm kiếm
        </Link>

        {isAdmin && (
          <Link
            href={`/admin/media/${media.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
          >
            <Pencil className="h-3.5 w-3.5" />
            Quản lý & Thêm link cho phim này
          </Link>
        )}
      </div>

      {/* Movie Info Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1322]">
        {backdrop && (
          <div className="absolute inset-0 opacity-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backdrop}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1322] via-[#0d1322]/70 to-transparent" />
          </div>
        )}

        <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:p-7">
          <div className="mx-auto w-36 shrink-0 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900 shadow-xl sm:mx-0 sm:w-44">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt={media.title}
                className="aspect-[2/3] h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center text-slate-700">
                <Film className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/40">
                {media.type === "MOVIE"
                  ? "Phim lẻ"
                  : media.type === "ANIME"
                  ? "Anime"
                  : "Phim bộ"}
              </span>
              {media.releaseYear && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2.5 py-0.5 font-mono text-xs text-slate-300">
                  <Calendar className="h-3 w-3" />
                  {media.releaseYear}
                </span>
              )}
              {media.imdbId && (
                <span className="rounded-md bg-slate-800/80 px-2.5 py-0.5 font-mono text-xs text-slate-400">
                  {media.imdbId}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {media.title}
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">
                {media.originalTitle}
              </p>
            </div>

            {media.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {media.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-0.5 text-xs text-slate-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {media.overview && (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                {media.overview}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Links Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Danh sách Phụ đề & Link Raw ({releasesDto.length})
          </h2>
          <p className="text-xs text-slate-500">
            Bấm biểu tượng tam giác cạnh link nếu link hỏng
          </p>
        </div>

        <ReleaseLinksClient
          releases={releasesDto}
          isSeries={media.type !== "MOVIE"}
        />
      </section>
    </div>
  );
}
