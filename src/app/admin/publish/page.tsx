import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  QuickPublishClient,
  type PublishMediaOption,
} from "@/components/admin/QuickPublishClient";

export const dynamic = "force-dynamic";

export default async function AdminPublishPage({
  searchParams,
}: {
  searchParams: Promise<{ mediaId?: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { mediaId } = await searchParams;

  const [selected, recent] = await Promise.all([
    mediaId
      ? db.mediaItem.findUnique({
          where: { id: mediaId },
          include: {
            episodes: {
              orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
            },
          },
        })
      : Promise.resolve(null),
    db.mediaItem.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        episodes: {
          orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
        },
      },
    }),
  ]);

  const toOption = (m: NonNullable<typeof selected>): PublishMediaOption => ({
    id: m.id,
    slug: m.slug,
    type: m.type,
    title: m.title,
    originalTitle: m.originalTitle,
    releaseYear: m.releaseYear,
    posterPath: m.posterPath,
    episodes: m.episodes.map((ep) => ({
      id: ep.id,
      seasonNumber: ep.seasonNumber,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
    })),
  });

  return (
    <QuickPublishClient
      initialSelectedMedia={selected ? toOption(selected) : null}
      recentMedia={recent.map(toOption)}
      siteUrl={env.NEXT_PUBLIC_SITE_URL}
    />
  );
}
