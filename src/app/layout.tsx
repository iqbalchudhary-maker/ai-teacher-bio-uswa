import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uswa College Bhowana - AI Biology Tutor",
  description: "Official AI Biology Teaching System for Uswa College Bhowana developed by SM Tech",
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-dvh w-screen bg-slate-900 font-sans antialiased text-slate-100 overflow-hidden relative">
        {children}
      </body>
    </html>
  );
}