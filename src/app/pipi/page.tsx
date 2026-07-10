import type { Metadata } from "next";

import { AnniversaryTakeover } from "@/components/landing/anniversary-takeover";

export const metadata: Metadata = {
  title: "致皮皮 — SIX YEARS",
  description: "2020.07.10 — 2026.07.10",
  robots: { index: false, follow: false },
};

export default function PipiPage() {
  return (
    <main className="min-h-screen bg-[#010103]">
      <AnniversaryTakeover force />
    </main>
  );
}
