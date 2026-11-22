import { env } from "@/lib/env";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type TmdbMediaKind = "MOVIE" | "TV" | "ANIME";

export interface ParsedTmdbInput {
  tmdbId: number;
  kind: "movie" | "tv" | null;
}

export interface TmdbSearchResultItem {
  tmdbId: number;
  mediaType: "movie" | "tv";
  suggestedKind: TmdbMediaKind;
  title: string;
  originalTitle: string;
  releaseYear: number | null;
  posterPath: string | null;
  overview: string;
}

export interface TmdbMediaDetails {
  tmdbId: number;
  imdbId: string | null;
  type: TmdbMediaKind;
  title: string;
  originalTitle: string;
  releaseYear: number | null;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  genres: string[];
  seasons: Array<{
    seasonNumber: number;
    name: string;
    episodeCount: number;
  }>;
}

export interface TmdbEpisodeInfo {
  seasonNumber: number;
  episodeNumber: number;
  title: string;
}

/**
 * Tách TMDB ID và loại phim từ URL TMDB hoặc chuỗi nhập trực tiếp.
 * Hỗ trợ:
 * - https://www.themoviedb.org/movie/533535-deadpool-wolverine
 * - https://www.themoviedb.org/tv/94605-arcane
 * - movie:533535 / tv:94605 / 533535
 */
export function parseTmdbInput(input: string): ParsedTmdbInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
  if (urlMatch) {
    return {
      kind: urlMatch[1].toLowerCase() as "movie" | "tv",
      tmdbId: Number(urlMatch[2]),
    };
  }

  const prefixMatch = trimmed.match(/^(movie|tv):(\d+)$/i);
  if (prefixMatch) {
    return {
      kind: prefixMatch[1].toLowerCase() as "movie" | "tv",
      tmdbId: Number(prefixMatch[2]),
    };
  }

  if (/^\d+$/.test(trimmed)) {
    return {
      kind: null,
      tmdbId: Number(trimmed),
    };
  }

  return null;
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  if (!env.TMDB_API_KEY) {
    throw new Error(
      "Chưa cấu hình TMDB_API_KEY trong file .env. Vui lòng thêm API key từ themoviedb.org."
    );
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", env.TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`TMDB API lỗi (${res.status}): ${res.statusText}`);
  }
  return (await res.json()) as T;
}

function inferKind(
  mediaType: "movie" | "tv",
  genreIds: number[],
  originCountries: string[] = [],
  originalLanguage?: string
): TmdbMediaKind {
  const isAnimation = genreIds.includes(16);
  const isJapanese =
    originCountries.includes("JP") || originalLanguage === "ja";
  if (mediaType === "tv" && isAnimation && isJapanese) {
    return "ANIME";
  }
  return mediaType === "movie" ? "MOVIE" : "TV";
}

interface RawSearchItem {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string;
  genre_ids?: number[];
  origin_country?: string[];
  original_language?: string;
}

export async function searchTmdb(
  query: string
): Promise<TmdbSearchResultItem[]> {
  const parsed = parseTmdbInput(query);
  if (parsed) {
    const items: TmdbSearchResultItem[] = [];
    const kindsToTry: Array<"movie" | "tv"> = parsed.kind
      ? [parsed.kind]
      : ["movie", "tv"];

    for (const kind of kindsToTry) {
      try {
        const details = await getTmdbDetails(parsed.tmdbId, kind);
        items.push({
          tmdbId: details.tmdbId,
          mediaType: kind,
          suggestedKind: details.type,
          title: details.title,
          originalTitle: details.originalTitle,
          releaseYear: details.releaseYear,
          posterPath: details.posterPath,
          overview: details.overview,
        });
      } catch {
        // Ignore if ID doesn't exist for that kind
      }
    }
    return items;
  }

  const data = await tmdbFetch<{ results: RawSearchItem[] }>("/search/multi", {
    query,
    language: "vi-VN",
    include_adult: "false",
  });

  return data.results
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .slice(0, 12)
    .map((item) => {
      const mediaType = item.media_type as "movie" | "tv";
      const dateStr = item.release_date || item.first_air_date || "";
      const year = dateStr ? Number(dateStr.slice(0, 4)) : null;

      return {
        tmdbId: item.id,
        mediaType,
        suggestedKind: inferKind(
          mediaType,
          item.genre_ids ?? [],
          item.origin_country ?? [],
          item.original_language
        ),
        title: item.title || item.name || item.original_title || item.original_name || "Không rõ tên",
        originalTitle:
          item.original_title || item.original_name || item.title || item.name || "",
        releaseYear: Number.isFinite(year) ? year : null,
        posterPath: item.poster_path ?? null,
        overview: item.overview ?? "",
      };
    });
}

interface RawTmdbDetail {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: Array<{ id: number; name: string }>;
  origin_country?: string[];
  original_language?: string;
  external_ids?: { imdb_id?: string | null };
  seasons?: Array<{
    season_number: number;
    name: string;
    episode_count: number;
  }>;
}

export async function getTmdbDetails(
  tmdbId: number,
  kind: "movie" | "tv"
): Promise<TmdbMediaDetails> {
  const [viData, enData] = await Promise.all([
    tmdbFetch<RawTmdbDetail>(`/${kind}/${tmdbId}`, {
      language: "vi-VN",
      append_to_response: "external_ids",
    }),
    tmdbFetch<RawTmdbDetail>(`/${kind}/${tmdbId}`, {
      language: "en-US",
    }).catch(() => null),
  ]);

  const dateStr = viData.release_date || viData.first_air_date || "";
  const year = dateStr ? Number(dateStr.slice(0, 4)) : null;
  const genreIds = (viData.genres ?? []).map((g) => g.id);

  return {
    tmdbId: viData.id,
    imdbId: viData.external_ids?.imdb_id ?? null,
    type: inferKind(
      kind,
      genreIds,
      viData.origin_country ?? [],
      viData.original_language
    ),
    title:
      viData.title ||
      viData.name ||
      enData?.title ||
      enData?.name ||
      viData.original_title ||
      viData.original_name ||
      "Untitled",
    originalTitle:
      viData.original_title ||
      viData.original_name ||
      enData?.title ||
      enData?.name ||
      "",
    releaseYear: Number.isFinite(year) ? year : null,
    overview: viData.overview || enData?.overview || "",
    posterPath: viData.poster_path ?? enData?.poster_path ?? null,
    backdropPath: viData.backdrop_path ?? enData?.backdrop_path ?? null,
    genres: (viData.genres ?? []).map((g) => g.name),
    seasons: (viData.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => ({
        seasonNumber: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
      })),
  };
}

export async function getTmdbSeasonEpisodes(
  tmdbId: number,
  seasonNumber: number
): Promise<TmdbEpisodeInfo[]> {
  const data = await tmdbFetch<{
    episodes?: Array<{ episode_number: number; name?: string }>;
  }>(`/tv/${tmdbId}/season/${seasonNumber}`, {
    language: "vi-VN",
  });

  return (data.episodes ?? []).map((ep) => ({
    seasonNumber,
    episodeNumber: ep.episode_number,
    title: ep.name || `Tập ${ep.episode_number}`,
  }));
}
