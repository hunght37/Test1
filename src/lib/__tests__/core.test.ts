import { describe, expect, it } from "vitest";
import {
  buildMediaSearchText,
  normalizeVietnameseSearch,
} from "@/lib/search/vietnamese";
import {
  detectLinkProvider,
  isValidHttpUrl,
} from "@/lib/links/provider-detector";
import { parseTmdbInput } from "@/lib/tmdb/client";
import { createMediaSlug, formatEpisodeCode } from "@/lib/utils";

describe("normalizeVietnameseSearch", () => {
  it("chuẩn hóa tiếng Việt có dấu và đ/Đ về không dấu chữ thường", () => {
    expect(normalizeVietnameseSearch("Người Nhện: Không Còn Nhà")).toBe(
      "nguoi nhen khong con nha"
    );
    expect(normalizeVietnameseSearch("Đảo Hải Tặc - One Piece")).toBe(
      "dao hai tac one piece"
    );
  });

  it("gộp nhiều trường tìm kiếm sạch sẽ", () => {
    const text = buildMediaSearchText({
      title: "Đặc Vụ Bóng Đêm",
      originalTitle: "The Night Agent",
      altTitles: "Nguoi Gac Dem",
      imdbId: "tt13918776",
      releaseYear: 2023,
    });
    expect(text).toContain("dac vu bong dem");
    expect(text).toContain("the night agent");
    expect(text).toContain("tt13918776");
    expect(text).toContain("2023");
  });
});

describe("detectLinkProvider & isValidHttpUrl", () => {
  it("nhận diện đúng các nguồn phụ đề SubDL và SubSource", () => {
    expect(detectLinkProvider("https://subdl.com/s/info/abc")).toEqual({
      category: "SUBTITLE",
      provider: "SubDL",
    });
    expect(
      detectLinkProvider("https://subsource.net/subtitle/arcane/vietnamese/123")
    ).toEqual({
      category: "SUBTITLE",
      provider: "SubSource",
    });
  });

  it("nhận diện đúng các nguồn Raw Mux Vietsub", () => {
    expect(
      detectLinkProvider("https://drive.google.com/file/d/1xyz/view")
    ).toEqual({
      category: "RAW_MUX",
      provider: "Google Drive",
    });
    expect(detectLinkProvider("https://pixeldrain.com/u/abcd12")).toEqual({
      category: "RAW_MUX",
      provider: "Pixeldrain",
    });
    expect(detectLinkProvider("https://gofile.io/d/123456")).toEqual({
      category: "RAW_MUX",
      provider: "Gofile",
    });
    expect(detectLinkProvider("https://www.fshare.vn/file/ABCDEF")).toEqual({
      category: "RAW_MUX",
      provider: "Fshare",
    });
    expect(detectLinkProvider("https://mega.nz/file/xyz#123")).toEqual({
      category: "RAW_MUX",
      provider: "Mega",
    });
  });

  it("chặn URL nguy hiểm không phải http/https", () => {
    expect(isValidHttpUrl("https://subdl.com/test")).toBe(true);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("not-a-url")).toBe(false);
  });
});

describe("parseTmdbInput & utils", () => {
  it("tách đúng TMDB ID và loại từ URL hoặc prefix", () => {
    expect(
      parseTmdbInput(
        "https://www.themoviedb.org/movie/533535-deadpool-and-wolverine"
      )
    ).toEqual({ tmdbId: 533535, kind: "movie" });

    expect(parseTmdbInput("https://www.themoviedb.org/tv/94605-arcane")).toEqual({
      tmdbId: 94605,
      kind: "tv",
    });

    expect(parseTmdbInput("tv:94605")).toEqual({ tmdbId: 94605, kind: "tv" });
    expect(parseTmdbInput("533535")).toEqual({ tmdbId: 533535, kind: null });
    expect(parseTmdbInput("Spider-Man")).toBeNull();
  });

  it("tạo slug và mã tập phim chuẩn", () => {
    expect(createMediaSlug("Người Nhện", 2021, 634649)).toBe(
      "nguoi-nhen-2021-634649"
    );
    expect(formatEpisodeCode(1, 5)).toBe("S01E05");
  });
});
