"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    // جب یہ پیج لوڈ ہو گا تو سیدھا لاگ ان پیج پر چلا جائے گا
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-slate-900 text-white font-sans">
      <div className="text-center space-y-3">
        <div className="text-lg font-bold">Uswa College Bhowana</div>
        <p className="text-xs text-slate-400 animate-pulse">Redirecting to Login Portal...</p>
      </div>
    </div>
  );
}