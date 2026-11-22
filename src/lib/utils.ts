import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { normalizeVietnameseSearch } from "./search/vietnamese";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createMediaSlug(
  title: string,
  year: number | null | undefined,
  tmdbId: number
): string {
  const base = normalizeVietnameseSearch(title)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const yearPart = year ? `-${year}` : "";
  return `${base || "media"}${yearPart}-${tmdbId}`;
}

export function getTmdbImageUrl(
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" | "w780" | "w1280" | "original" = "w500"
): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function formatRelativeTimeVi(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

export function formatEpisodeCode(
  seasonNumber: number,
  episodeNumber: number
): string {
  const s = String(seasonNumber).padStart(2, "0");
  const e = String(episodeNumber).padStart(2, "0");
  return `S${s}E${e}`;
}
