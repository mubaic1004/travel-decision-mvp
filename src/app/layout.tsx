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
      <body>{children}</body>
    </html>
  );
}
