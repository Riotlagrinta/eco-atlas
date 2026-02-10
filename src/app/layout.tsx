import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eco-Atlas | Observatoire de la Biodiversité du Togo 🇹🇬",
  description: "Plateforme participative de surveillance de la faune, cartographie SIG et protection des parcs nationaux du Togo.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Eco-Atlas Togo",
    description: "Découvrez et protégez la biodiversité du Togo.",
    url: "https://eco-atlas.vercel.app",
    siteName: "Eco-Atlas Togo",
    images: [
      {
        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
      },
    ],
    locale: "fr_TG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eco-Atlas Togo",
    description: "L'outil citoyen pour la nature togolaise.",
    images: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=630&fit=crop"],
  },
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
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
