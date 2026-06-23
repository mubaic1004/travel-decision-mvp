import type { Metadata } from "next";
import { Anton_SC, Space_Mono } from "next/font/google";

import "@/app/globals.css";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-space-mono",
  display: "swap",
});

const antonDisplay = Anton_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "陈慕白 — chenmubai.cn",
  description: "业余时间做些小工具和小想法。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${spaceMono.variable} ${antonDisplay.variable}`}
    >
      <body>
        {children}
        <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 border-t border-white/10 bg-black py-6 text-center text-[11px] uppercase tracking-[0.18em] text-white/45">
          <a
            className="transition hover:text-white"
            href="https://beian.miit.gov.cn/"
            rel="noopener noreferrer"
            target="_blank"
          >
            沪ICP备2026019934号
          </a>
          <a
            className="transition hover:text-white"
            href="https://beian.mps.gov.cn/#/query/webSearch?code=31011502406091"
            rel="noopener noreferrer"
            target="_blank"
          >
            沪公网安备31011502406091号
          </a>
        </footer>
      </body>
    </html>
  );
}
