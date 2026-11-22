import { LinkCategory, MediaType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeVietnameseSearch } from "./vietnamese";

export interface SearchMediaOptions {
  q?: string;
  type?: MediaType | "ALL";
  category?: LinkCategory | "ALL";
  limit?: number;
}

export async function searchMediaCatalog(options: SearchMediaOptions = {}) {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 60);
  const normalizedQuery = options.q
    ? normalizeVietnameseSearch(options.q)
    : "";

  const where: Prisma.MediaItemWhereInput = {
    releases: {
      some: {
        isPublished: true,
        ...(options.category && options.category !== "ALL"
          ? {
              links: {
                some: {
                  category: options.category,
                  isAlive: true,
                },
              },
            }
          : {}),
      },
    },
  };

  if (options.type && options.type !== "ALL") {
    where.type = options.type;
  }

  if (normalizedQuery) {
    const tokens = normalizedQuery.split(" ").filter(Boolean);
    where.AND = tokens.map((token) => ({
      searchNormalized: {
        contains: token,
        mode: "insensitive",
      },
    }));
  }

  const items = await db.mediaItem.findMany({
    where,
    take: limit,
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      type: true,
      title: true,
      originalTitle: true,
      releaseYear: true,
      posterPath: true,
      genres: true,
      updatedAt: true,
      releases: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          releaseTag: true,
          language: true,
          createdAt: true,
          links: {
            where: { isAlive: true },
            select: {
              id: true,
              category: true,
              provider: true,
            },
          },
        },
      },
    },
  });

  return items.map((item) => {
    const allLinks = item.releases.flatMap((r) => r.links);
    const providers = Array.from(new Set(allLinks.map((l) => l.provider)));
    const hasSubtitle = allLinks.some((l) => l.category === "SUBTITLE");
    const hasRawMux = allLinks.some((l) => l.category === "RAW_MUX");

    return {
      ...item,
      providers,
      hasSubtitle,
      hasRawMux,
      latestRelease: item.releases[0] ?? null,
    };
  });
}
