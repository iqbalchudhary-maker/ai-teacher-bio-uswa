import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uswa College Bhowana - AI Biology Tutor",
  description: "Official AI Biology Teaching System developed by SM Tech AI Solutions",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.jpeg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Pure script approach without importing useEffect in Server Component
function ServiceWorkerRegister() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) { console.log('Service Worker registered successfully:', reg); })
                .catch(function(err) { console.log('Service Worker registration failed:', err); });
            });
          }
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <ServiceWorkerRegister />
      </head>
      <body className="h-dvh w-screen bg-slate-900 font-sans antialiased text-slate-100 overflow-hidden relative">
        {children}
      </body>
    </html>
  );
}