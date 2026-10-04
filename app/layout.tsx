import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TFT 공지 요청 시스템",
  description: "축제 공지 요청을 효율적으로 관리하세요",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
