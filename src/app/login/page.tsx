// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "لاگ ان میں مسئلہ پیش آیا");
      }

      // Redirect to Student Dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dir-rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-gray-200">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-blue-900">اسوہ کالج بھوانہ</h1>
          <p className="text-xs text-gray-500 mt-1">Uswa College Bhowana - AI Biology Tutor Portal</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Powered by SM Tech AI Solutions</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رول نمبر (Roll Number)</label>
            <input
              type="text"
              required
              placeholder="e.g., USWA-2026-001"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">پاس ورڈ (Password)</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 py-3 text-sm font-bold text-white hover:bg-blue-800 transition disabled:opacity-50 shadow-md cursor-pointer"
          >
            {loading ? "لاگ ان ہو رہا ہے..." : "لاگ ان کریں (Login)"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Uswa College Bhowana | Principal: Ghulam Abbas Bhatti
        </div>
      </div>
    </div>
  );
}