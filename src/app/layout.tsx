import type { Metadata } from "next";
import { Fraunces, Noto_Serif_SC, ZCOOL_KuaiLe } from "next/font/google";

import "@/app/globals.css";

const roundedDisplay = ZCOOL_KuaiLe({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rounded-display",
  display: "swap",
});

const serifDisplay = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-serif-display",
  display: "swap",
});

const serifItalic = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: "italic",
  variable: "--font-serif-italic",
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
      className={`${roundedDisplay.variable} ${serifDisplay.variable} ${serifItalic.variable}`}
    >
      <body>
        {children}
        <footer className="border-t border-stone-200/70 bg-stone-50/60 py-5 text-center text-xs text-stone-500">
          <a
            className="transition hover:text-stone-700"
            href="https://beian.miit.gov.cn/"
            rel="noopener noreferrer"
            target="_blank"
          >
            沪ICP备2026019934号
          </a>
        </footer>
      </body>
    </html>
  );
}
