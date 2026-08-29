import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const manrope = Manrope({ subsets: ["cyrillic", "latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Good Day Афиша — куда сходить сегодня", template: "%s — Good Day Афиша" },
  description: "Актуальные события Полоцка и Новополоцка: концерты, кино, выставки, фестивали и события для детей.",
  applicationName: "Good Day Афиша",
  icons: { icon: "/brand/good-day-logo.png", apple: "/brand/good-day-logo.png" },
  openGraph: {
    title: "Good Day Афиша",
    description: "Твой город. Твой хороший день.",
    type: "website",
    locale: "ru_BY",
    siteName: "Good Day Афиша",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Good Day Афиша" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Good Day Афиша",
    description: "Твой город. Твой хороший день.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#3561f4" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru" data-scroll-behavior="smooth"><body className={manrope.variable}><Header />{children}<Footer /></body></html>;
}

