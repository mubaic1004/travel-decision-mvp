"use client";

import { motion } from "motion/react";

// ── 改这里：数字面板 ───────────────────────────────
const STATS = [
  { value: "04", label: "在线工具", sub: "TOOLS LIVE" },
  { value: "50+", label: "覆盖城市", sub: "CITIES" },
  { value: "2026", label: "始于", sub: "SINCE" },
  { value: "100%", label: "独立搭建", sub: "SELF-BUILT" },
];
// ───────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

export function StatsSection() {
  return (
    <section className="border-t border-white/10 py-20 sm:py-28">
      <div className="mb-12 flex items-baseline justify-between text-[11px] uppercase tracking-[0.28em] text-white/40 sm:mb-16">
        <span>数字 / BY THE NUMBERS</span>
        <span className="text-white/25">03</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
        {STATS.map((stat, index) => (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            key={stat.sub}
            transition={{ duration: 0.8, delay: index * 0.1, ease }}
            viewport={{ once: true, amount: 0.4 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="text-[clamp(44px,9vw,84px)] font-normal leading-none tracking-[-0.04em] text-white">
              {stat.value}
            </div>
            <div className="mt-4 text-sm text-white/55">{stat.label}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/30">
              {stat.sub}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
