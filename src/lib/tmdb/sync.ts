import { MediaType } from "@prisma/client";
import { db } from "@/lib/db";
import { buildMediaSearchText } from "@/lib/search/vietnamese";
import { createMediaSlug } from "@/lib/utils";
import {
  getTmdbDetails,
  getTmdbSeasonEpisodes,
  type TmdbMediaKind,
} from "./client";

export async function syncMediaFromTmdb(params: {
  tmdbId: number;
  kind: "movie" | "tv";
  overrideType?: MediaType;
  altTitles?: string;
}) {
  const details = await getTmdbDetails(params.tmdbId, params.kind);
  const mediaType: MediaType =
    params.overrideType ?? (details.type as MediaType);

  const searchNormalized = buildMediaSearchText({
    title: details.title,
    originalTitle: details.originalTitle,
    altTitles: params.altTitles,
    imdbId: details.imdbId,
    releaseYear: details.releaseYear,
  });

  const slug = createMediaSlug(
    details.title || details.originalTitle,
    details.releaseYear,
    details.tmdbId
  );

  const media = await db.mediaItem.upsert({
    where: {
      tmdbId_type: {
        tmdbId: details.tmdbId,
        type: mediaType,
      },
    },
    update: {
      title: details.title,
      originalTitle: details.originalTitle,
      imdbId: details.imdbId,
      releaseYear: details.releaseYear,
      overview: details.overview,
      posterPath: details.posterPath,
      backdropPath: details.backdropPath,
      genres: details.genres,
      searchNormalized,
      ...(params.altTitles !== undefined ? { altTitles: params.altTitles } : {}),
    },
    create: {
      tmdbId: details.tmdbId,
      imdbId: details.imdbId,
      type: mediaType,
      title: details.title,
      originalTitle: details.originalTitle,
      altTitles: params.altTitles ?? null,
      slug,
      searchNormalized,
      releaseYear: details.releaseYear,
      overview: details.overview,
      posterPath: details.posterPath,
      backdropPath: details.backdropPath,
      genres: details.genres,
    },
  });

  // Nếu là TV / ANIME thì kéo danh sách các tập cho từng season (bỏ qua season 0 specials trừ khi cần)
  if (params.kind === "tv" && details.seasons.length > 0) {
    const targetSeasons = details.seasons.slice(0, 10);
    for (const season of targetSeasons) {
      const episodes = await getTmdbSeasonEpisodes(
        details.tmdbId,
        season.seasonNumber
      );
      if (episodes.length > 0) {
        await db.$transaction(
          episodes.map((ep) =>
            db.episode.upsert({
              where: {
                mediaId_seasonNumber_episodeNumber: {
                  mediaId: media.id,
                  seasonNumber: ep.seasonNumber,
                  episodeNumber: ep.episodeNumber,
                },
              },
              update: { title: ep.title },
              create: {
                mediaId: media.id,
                seasonNumber: ep.seasonNumber,
                episodeNumber: ep.episodeNumber,
                title: ep.title,
              },
            })
          )
        );
      }
    }
  }

  return db.mediaItem.findUnique({
    where: { id: media.id },
    include: {
      episodes: {
        orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
      },
    },
  });
}

export async function createManualMedia(input: {
  type: TmdbMediaKind;
  title: string;
  originalTitle: string;
  altTitles?: string;
  releaseYear?: number | null;
  overview?: string;
  genres?: string[];
}) {
  const pseudoTmdbId = -Math.floor(Date.now() / 1000);
  const slug = createMediaSlug(
    input.title || input.originalTitle,
    input.releaseYear,
    Math.abs(pseudoTmdbId)
  );

  return db.mediaItem.create({
    data: {
      tmdbId: pseudoTmdbId,
      type: input.type,
      title: input.title,
      originalTitle: input.originalTitle,
      altTitles: input.altTitles ?? null,
      slug,
      searchNormalized: buildMediaSearchText({
        title: input.title,
        originalTitle: input.originalTitle,
        altTitles: input.altTitles,
        releaseYear: input.releaseYear,
      }),
      releaseYear: input.releaseYear ?? null,
      overview: input.overview ?? null,
      genres: input.genres ?? [],
    },
  });
}
