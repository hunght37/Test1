export type LinkCategoryType = "SUBTITLE" | "RAW_MUX";

export interface DetectedLinkInfo {
  category: LinkCategoryType;
  provider: string;
}

export interface ProviderBadgeStyle {
  label: string;
  badgeClass: string;
}

/**
 * Kiểm tra URL hợp lệ (chỉ cho phép http/https để tránh XSS javascript:).
 */
export function isValidHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Tự động phân loại và nhận diện nguồn link (SubDL, SubSource, Google Drive, Pixeldrain, Gofile...).
 */
export function detectLinkProvider(url: string): DetectedLinkInfo {
  const trimmed = url.trim();
  let host = "";
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    host = trimmed.toLowerCase();
  }

  // Nguồn phụ đề rời WEB-DL
  if (host.includes("subdl.com") || host.includes("subdl.")) {
    return { category: "SUBTITLE", provider: "SubDL" };
  }
  if (host.includes("subsource.net") || host.includes("subsource.")) {
    return { category: "SUBTITLE", provider: "SubSource" };
  }
  if (host.includes("opensubtitles")) {
    return { category: "SUBTITLE", provider: "OpenSubtitles" };
  }

  // Nguồn Raw đã mux sẵn Vietsub
  if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
    return { category: "RAW_MUX", provider: "Google Drive" };
  }
  if (host.includes("pixeldrain.com")) {
    return { category: "RAW_MUX", provider: "Pixeldrain" };
  }
  if (host.includes("gofile.io")) {
    return { category: "RAW_MUX", provider: "Gofile" };
  }
  if (host.includes("fshare.vn")) {
    return { category: "RAW_MUX", provider: "Fshare" };
  }
  if (host.includes("mega.nz")) {
    return { category: "RAW_MUX", provider: "Mega" };
  }
  if (host.includes("1fichier.com")) {
    return { category: "RAW_MUX", provider: "1Fichier" };
  }
  if (host.includes("terabox") || host.includes("1024tera")) {
    return { category: "RAW_MUX", provider: "TeraBox" };
  }
  if (host.includes("buzzheavier.com")) {
    return { category: "RAW_MUX", provider: "Buzzheavier" };
  }

  return { category: "RAW_MUX", provider: "Mirror Link" };
}

export function getProviderStyle(provider: string): ProviderBadgeStyle {
  switch (provider) {
    case "SubDL":
      return {
        label: "SubDL",
        badgeClass:
          "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
      };
    case "SubSource":
      return {
        label: "SubSource",
        badgeClass:
          "border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25",
      };
    case "OpenSubtitles":
      return {
        label: "OpenSubtitles",
        badgeClass:
          "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
      };
    case "Google Drive":
      return {
        label: "Google Drive",
        badgeClass:
          "border-blue-500/40 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25",
      };
    case "Pixeldrain":
      return {
        label: "Pixeldrain",
        badgeClass:
          "border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25",
      };
    case "Gofile":
      return {
        label: "Gofile",
        badgeClass:
          "border-teal-500/40 bg-teal-500/15 text-teal-300 hover:bg-teal-500/25",
      };
    case "Fshare":
      return {
        label: "Fshare",
        badgeClass:
          "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25",
      };
    case "Mega":
      return {
        label: "Mega",
        badgeClass:
          "border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25",
      };
    default:
      return {
        label: provider,
        badgeClass:
          "border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700",
      };
  }
}
