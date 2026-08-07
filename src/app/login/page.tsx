"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [rollNo, setRollNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNo, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Cookie set karein taake dashboard protect ho jaye
        document.cookie = `studentRollNo=${rollNo}; path=/; max-age=86400`;
        router.push("/dashboard");
      } else {
        setError(data.message || "Invalid Roll Number or Password");
      }
    } catch (err) {
      console.error(err);
      setError("Network ka masla hai. Baraye meherbani dobara koshish karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-slate-900 px-4" dir="ltr">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-800 p-8 text-left">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg border-2 border-blue-400 overflow-hidden mb-3">
            <img src="/logo.jpeg" alt="Uswa College Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 text-center">Uswa College Bhowana</h1>
          <p className="text-xs text-blue-600 font-semibold mt-1">Student AI Portal Login</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number / Student ID</label>
            <input
              type="text"
              required
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g. USWA-2026-01"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password / PIN</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md cursor-pointer mt-2"
          >
            {loading ? "Verifying with Database..." : "Login to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}