import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  AdminMediaEditClient,
  type AdminEditMediaDTO,
} from "@/components/admin/AdminMediaEditClient";

export const dynamic = "force-dynamic";

export default async function AdminMediaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const media = await db.mediaItem.findUnique({
    where: { id },
    include: {
      releases: {
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

  const dto: AdminEditMediaDTO = {
    id: media.id,
    slug: media.slug,
    type: media.type,
    title: media.title,
    originalTitle: media.originalTitle,
    altTitles: media.altTitles,
    overview: media.overview,
    isFeatured: media.isFeatured,
    releases: media.releases.map((r) => ({
      id: r.id,
      title: r.title,
      releaseTag: r.releaseTag,
      isPublished: r.isPublished,
      episode: r.episode
        ? {
            seasonNumber: r.episode.seasonNumber,
            episodeNumber: r.episode.episodeNumber,
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
    })),
  };

  return <AdminMediaEditClient media={dto} />;
}
