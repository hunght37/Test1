import { NextResponse } from "next/server";
import { LinkCategory, ReleaseLanguage } from "@prisma/client";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  detectLinkProvider,
  isValidHttpUrl,
} from "@/lib/links/provider-detector";

const linkInputSchema = z.object({
  url: z.string().trim().refine(isValidHttpUrl, "URL không hợp lệ"),
  category: z.nativeEnum(LinkCategory).optional(),
  provider: z.string().trim().optional(),
  quality: z.string().trim().optional(),
  fileSizeText: z.string().trim().optional(),
});

const createReleaseSchema = z.object({
  mediaId: z.string().min(1),
  episodeId: z.string().nullable().optional(),
  seasonNumber: z.number().int().min(0).optional(),
  episodeNumber: z.number().int().min(1).optional(),
  episodeTitle: z.string().trim().optional(),
  title: z.string().trim().min(1),
  releaseTag: z.string().trim().min(1),
  language: z.nativeEnum(ReleaseLanguage).default("VI"),
  notes: z.string().trim().optional(),
  links: z.array(linkInputSchema).min(1, "Cần ít nhất 1 link SubDL/SubSource hoặc Raw Mux"),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const parsed = createReleaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu chưa hợp lệ.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const media = await db.mediaItem.findUnique({
    where: { id: data.mediaId },
    select: { id: true, slug: true, title: true },
  });
  if (!media) {
    return NextResponse.json({ error: "Không tìm thấy phim." }, { status: 404 });
  }

  let resolvedEpisodeId = data.episodeId ?? null;
  if (
    !resolvedEpisodeId &&
    data.seasonNumber !== undefined &&
    data.episodeNumber !== undefined
  ) {
    const ep = await db.episode.upsert({
      where: {
        mediaId_seasonNumber_episodeNumber: {
          mediaId: media.id,
          seasonNumber: data.seasonNumber,
          episodeNumber: data.episodeNumber,
        },
      },
      update: data.episodeTitle ? { title: data.episodeTitle } : {},
      create: {
        mediaId: media.id,
        seasonNumber: data.seasonNumber,
        episodeNumber: data.episodeNumber,
        title: data.episodeTitle || `Tập ${data.episodeNumber}`,
      },
    });
    resolvedEpisodeId = ep.id;
  }

  const release = await db.$transaction(async (tx) => {
    const created = await tx.releaseEntry.create({
      data: {
        mediaId: media.id,
        episodeId: resolvedEpisodeId,
        title: data.title,
        releaseTag: data.releaseTag,
        language: data.language,
        notes: data.notes || null,
        links: {
          create: data.links.map((item) => {
            const detected = detectLinkProvider(item.url);
            return {
              url: item.url,
              category: item.category ?? detected.category,
              provider: item.provider || detected.provider,
              quality: item.quality || null,
              fileSizeText: item.fileSizeText || null,
            };
          }),
        },
      },
      include: {
        episode: true,
        links: true,
      },
    });

    await tx.mediaItem.update({
      where: { id: media.id },
      data: { updatedAt: new Date() },
    });

    return created;
  });

  return NextResponse.json({ release, media }, { status: 201 });
}
