"use client";

import { motion } from "motion/react";

// ── 改这里：此刻在做什么（想起来就更新）───────────────
const NOW_UPDATED = "2026.06";
const NOW_ITEMS = [
  { k: "在做", v: "给这个站慢慢加更多小工具和小想法。" },
  { k: "在学", v: "前端动效、设计语言，以及怎么把 AI 用得更顺手。" },
  { k: "最近", v: "跑通了 ICP 和公安备案，国内终于能顺畅访问了。" },
];
// ───────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

export function NowSection() {
  return (
    <section className="border-t border-white/10 py-20 sm:py-28" id="now">
      <div className="mb-12 flex items-baseline justify-between text-[11px] uppercase tracking-[0.28em] text-white/40 sm:mb-16">
        <span>此刻 / NOW</span>
        <span className="text-white/25">UPDATED {NOW_UPDATED}</span>
      </div>

      <div className="space-y-8">
        {NOW_ITEMS.map((item, index) => (
          <motion.div
            className="grid grid-cols-[auto_1fr] items-baseline gap-6 border-b border-white/10 pb-8 sm:gap-12"
            initial={{ opacity: 0, y: 20 }}
            key={item.k}
            transition={{ duration: 0.7, delay: index * 0.1, ease }}
            viewport={{ once: true, amount: 0.4 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <span className="w-16 text-[11px] uppercase tracking-[0.15em] text-white/35 sm:w-24">
              {item.k}
            </span>
            <p className="text-lg font-normal leading-relaxed text-white sm:text-xl">
              {item.v}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
