"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Đăng nhập thất bại.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-16">
      <div className="rounded-2xl border border-slate-800 bg-[#0d1422] p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Đăng nhập Admin</h1>
            <p className="text-xs text-slate-400">
              Khu vực quản lý phim, link SubDL/SubSource & Raw Mux
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Mật khẩu quản trị
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập ADMIN_PASSWORD..."
              className="w-full rounded-xl border border-slate-700 bg-[#080c15] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
