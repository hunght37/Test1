import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { env } from "@/lib/env";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: `${env.NEXT_PUBLIC_SITE_NAME} — Tìm nhanh Phụ đề Việt WEB-DL & Raw Mux Vietsub`,
    template: `%s | ${env.NEXT_PUBLIC_SITE_NAME}`,
  },
  description:
    "Tìm kiếm siêu nhanh phụ đề tiếng Việt chuẩn WEB-DL (SubDL, SubSource) và link bản Raw đã mux sẵn Vietsub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <Navbar siteName={env.NEXT_PUBLIC_SITE_NAME} />
        <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-4 py-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-[#070a12] py-6 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-6xl px-4">
            {env.NEXT_PUBLIC_SITE_NAME} — Cổng tra cứu nhanh link phụ đề WEB-DL
            (SubDL / SubSource) & bản Raw mux Vietsub.
          </div>
        </footer>
      </body>
    </html>
  );
}
