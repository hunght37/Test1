"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Film, Search, ShieldCheck } from "lucide-react";
import { QuickSearchModal } from "@/components/search/QuickSearchModal";

export function Navbar({ siteName }: { siteName: string }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20">
                <Film className="h-4 w-4" />
              </span>
              <span>{siteName}</span>
            </Link>

            <nav className="hidden items-center gap-4 text-sm text-slate-300 md:flex">
              <Link
                href="/?type=MOVIE"
                className="transition-colors hover:text-amber-400"
              >
                Phim lẻ
              </Link>
              <Link
                href="/?type=TV"
                className="transition-colors hover:text-amber-400"
              >
                Phim bộ
              </Link>
              <Link
                href="/?type=ANIME"
                className="transition-colors hover:text-amber-400"
              >
                Anime
              </Link>
              <Link
                href="/?category=RAW_MUX"
                className="transition-colors hover:text-emerald-400"
              >
                Có Raw Mux sẵn
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-sm text-slate-400 transition hover:border-amber-500/60 hover:text-slate-200"
            >
              <Search className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Tìm nhanh phim...</span>
              <span className="sm:hidden">Tìm phim</span>
              <kbd className="hidden rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300 sm:inline-block">
                Ctrl K
              </kbd>
            </button>

            <Link
              href="/admin"
              title="Quản trị Admin"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </header>

      <QuickSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
