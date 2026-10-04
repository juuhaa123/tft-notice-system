import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const base = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-base",
});

export const metadata: Metadata = {
  title: "TFT 공지 요청",
  description: "축제 TFT 공지 요청 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={base.variable}>
      <body className="bg-canvas text-foreground antialiased">{children}</body>
    </html>
  );
}
