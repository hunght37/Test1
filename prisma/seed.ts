import { PrismaClient } from "@prisma/client";
import { buildMediaSearchText } from "../src/lib/search/vietnamese";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.mediaItem.count();
  if (count > 0) {
    console.log("Database đã có dữ liệu, bỏ qua seed.");
    return;
  }

  await prisma.mediaItem.create({
    data: {
      tmdbId: 533535,
      imdbId: "tt6263850",
      type: "MOVIE",
      title: "Deadpool & Wolverine",
      originalTitle: "Deadpool & Wolverine",
      altTitles: "Deadpool 3",
      slug: "deadpool-wolverine-2024-533535",
      searchNormalized: buildMediaSearchText({
        title: "Deadpool & Wolverine",
        originalTitle: "Deadpool & Wolverine",
        altTitles: "Deadpool 3",
        imdbId: "tt6263850",
        releaseYear: 2024,
      }),
      releaseYear: 2024,
      overview:
        "Wade Wilson đối mặt với một mối đe dọa tồn vong và phải thuyết phục Wolverine miễn cưỡng sát cánh cùng mình.",
      genres: ["Hành động", "Hài", "Khoa học viễn tưởng"],
      releases: {
        create: {
          title: "Full Movie WEB-DL (Mẫu)",
          releaseTag: "1080p.DSNP.WEB-DL.DDP5.1.H264",
          language: "VI",
          notes: "Dữ liệu mẫu để kiểm thử tìm kiếm và giao diện.",
          links: {
            create: [
              {
                category: "SUBTITLE",
                provider: "SubDL",
                url: "https://subdl.com",
                quality: "SRT",
              },
              {
                category: "SUBTITLE",
                provider: "SubSource",
                url: "https://subsource.net",
                quality: "SRT",
              },
              {
                category: "RAW_MUX",
                provider: "Google Drive",
                url: "https://drive.google.com",
                quality: "1080p WEB-DL",
                fileSizeText: "2.4 GB",
              },
            ],
          },
        },
      },
    },
  });

  console.log("Đã tạo dữ liệu mẫu thành công.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
