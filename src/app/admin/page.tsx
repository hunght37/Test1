import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  AdminDashboardClient,
  type AdminMediaRowDTO,
  type AdminReportDTO,
} from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [mediaCount, releaseCount, clickAgg, reports, mediaItems] =
    await Promise.all([
      db.mediaItem.count(),
      db.releaseEntry.count(),
      db.externalLink.aggregate({ _sum: { clickCount: true } }),
      db.brokenReport.findMany({
        where: { isHandled: false },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          link: {
            include: {
              release: {
                include: {
                  media: {
                    select: { id: true, title: true, slug: true },
                  },
                },
              },
            },
          },
        },
      }),
      db.mediaItem.findMany({
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: {
          releases: {
            select: {
              id: true,
              _count: { select: { links: true } },
            },
          },
        },
      }),
    ]);

  const reportDtos: AdminReportDTO[] = reports.map((r) => ({
    id: r.id,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
    link: {
      id: r.link.id,
      provider: r.link.provider,
      url: r.link.url,
      isAlive: r.link.isAlive,
      release: {
        title: r.link.release.title,
        media: r.link.release.media,
      },
    },
  }));

  const mediaRows: AdminMediaRowDTO[] = mediaItems.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    originalTitle: m.originalTitle,
    type: m.type,
    releaseYear: m.releaseYear,
    updatedAt: m.updatedAt.toISOString(),
    releaseCount: m.releases.length,
    linkCount: m.releases.reduce((sum, rel) => sum + rel._count.links, 0),
  }));

  return (
    <AdminDashboardClient
      stats={{
        mediaCount,
        releaseCount,
        totalClicks: clickAgg._sum.clickCount ?? 0,
        openReports: reportDtos.length,
      }}
      initialReports={reportDtos}
      mediaRows={mediaRows}
    />
  );
}
