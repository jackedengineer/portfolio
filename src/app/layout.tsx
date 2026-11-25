import type { Metadata, Viewport } from "next";
import { Chivo, Chivo_Mono, Reenie_Beanie } from "next/font/google";
import type { ReactNode } from "react";

import { site } from "@content/site";

import "./globals.css";

const chivo = Chivo({ subsets: ["latin"], variable: "--font-chivo", display: "swap" });
const chivoMono = Chivo_Mono({ subsets: ["latin"], variable: "--font-chivo-mono", display: "swap" });
const reenie = Reenie_Beanie({ subsets: ["latin"], weight: "400", variable: "--font-reenie", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · ${site.role}`, template: `%s · ${site.name}` },
  description: site.description,
  alternates: { types: { "application/atom+xml": "/feed.xml" } },
  openGraph: { type: "website", siteName: site.name, url: site.url },
};

export const viewport: Viewport = { themeColor: "#f5f7fb", colorScheme: "light" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${chivo.variable} ${chivoMono.variable} ${reenie.variable}`}>
      <body>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
