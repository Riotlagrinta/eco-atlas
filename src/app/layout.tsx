import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eco-Atlas | Observatoire de la Biodiversité",
  description: "Plateforme écologique hybride : observatoire des espèces en danger, cartographie géo-spatiale et écotourisme.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Eco-Atlas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-50 text-gray-900`}
      >
        <Navbar />
        <main className="pt-16 pb-24 md:pb-0 min-h-screen">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
