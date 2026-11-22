/**
 * Chuẩn hóa chuỗi tiếng Việt về dạng không dấu, chữ thường để hỗ trợ
 * tìm kiếm nhanh dù người dùng gõ có dấu, thiếu dấu hay gõ chữ đ/Đ.
 */
export function normalizeVietnameseSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildMediaSearchText(parts: {
  title: string;
  originalTitle: string;
  altTitles?: string | null;
  imdbId?: string | null;
  releaseYear?: number | null;
}): string {
  const raw = [
    parts.title,
    parts.originalTitle,
    parts.altTitles ?? "",
    parts.imdbId ?? "",
    parts.releaseYear ? String(parts.releaseYear) : "",
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeVietnameseSearch(raw);
}
