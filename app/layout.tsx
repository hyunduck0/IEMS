import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_KR, Orbit } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const orbit = Orbit({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const plexSansKr = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "검사 설비 현황 모니터링 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${orbit.variable} ${plexSansKr.variable} ${plexMono.variable}`}>
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
