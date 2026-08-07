"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // اگر براؤزر کا اپنا پرامپٹ تیار ہے تو فوراً ونڈو اوپن کر دے گا
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      }
      setDeferredPrompt(null);
    } else {
      // اگر پرامپٹ ابھی کیچ نہیں ہوا تو اسکرین پر آسان گائیڈ شو کر دے گا
      setShowGuide(true);
    }
  };

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-slate-900 text-white font-sans px-4 relative">
      <div className="text-center space-y-6 max-w-md w-full bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-md">
        
        {/* College Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
            Uswa College Bhowana
          </h1>
          <p className="text-xs text-slate-400">
            AI Biology Teacher - Learning Portal
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          
          {/* 1. Login Portal Button */}
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition duration-200 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            🚀 Login Portal
          </button>

          {/* 2. Install App Button */}
          <button
            onClick={handleInstallClick}
            className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold rounded-xl transition duration-200 border border-slate-600 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            💻 Install App
          </button>

        </div>

        <div className="text-[10px] text-slate-500 pt-2">
          Powered by SM Tech AI Solutions
        </div>

      </div>

      {/* Instant Guide Modal if direct prompt isn't ready */}
      {showGuide && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-blue-400">App Installation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              براؤزر کی سیکیورٹی پالیسی کی وجہ سے ایک کلک پر انسٹالیشن کے لیے براہ کرم کروم کے اوپر دائیں کونے والے مینو (<span className="text-yellow-400 font-bold">⋮</span>) پر کلک کریں اور <span className="text-green-400 font-bold">"Install Uswa Biology Teacher"</span> پر کلک کریں۔
            </p>
            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              ٹھیک ہے (Got it)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}