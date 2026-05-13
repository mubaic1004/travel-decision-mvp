import type { Metadata } from "next";
import { ZCOOL_KuaiLe } from "next/font/google";

import "@/app/globals.css";

const roundedDisplay = ZCOOL_KuaiLe({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rounded-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Travel Decision MVP",
  description:
    "A minimalist travel decision tool that compares cheapest, least-leave, and best-value trips using rule-based pricing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={roundedDisplay.variable}>
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
