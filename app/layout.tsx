import type { Metadata } from "next";
import { Noto_Sans_KR, Black_Han_Sans } from "next/font/google";
import "./globals.css";

const base = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-base",
});

const point = Black_Han_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-point",
});

export const metadata: Metadata = {
  title: "DREAMERS 공지 요청",
  description: "2026 창문축제 TFT 공지 요청 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${base.variable} ${point.variable}`}>
      <body className="bg-ground text-paper antialiased">{children}</body>
    </html>
  );
}
