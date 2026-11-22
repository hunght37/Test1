import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  let mediaItems: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    mediaItems = await db.mediaItem.findMany({
      where: { releases: { some: { isPublished: true } } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    });
  } catch {
    mediaItems = [];
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...mediaItems.map((item) => ({
      url: `${baseUrl}/media/${item.slug}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
