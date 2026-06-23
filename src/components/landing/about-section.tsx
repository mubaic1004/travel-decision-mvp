"use client";

import { motion } from "motion/react";

// ── 改这里：自述内容 ───────────────────────────────
const STATEMENT =
  "我不是程序员。这个站点和上面的工具，是我业余时间和一个 AI agent 一起，从一行代码、一个域名、一张备案开始，一点点搭起来的。";
const STATEMENT_SUB =
  "我喜欢把脑子里模糊的小想法，做成真正能用的小东西。慢一点没关系 —— 做出来，能用，就好。";
// ───────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

export function AboutSection() {
  return (
    <section className="border-t border-white/10 py-20 sm:py-28" id="about">
      <div className="mb-10 flex items-baseline justify-between text-[11px] uppercase tracking-[0.28em] text-white/40 sm:mb-14">
        <span>关于 / ABOUT</span>
        <span className="text-white/25">01</span>
      </div>

      <motion.p
        className="max-w-3xl text-xl font-normal leading-[1.5] tracking-[-0.01em] text-white sm:text-2xl lg:text-[2rem] lg:leading-[1.45]"
        initial={{ opacity: 0, y: 24 }}
        transition={{ duration: 1, ease }}
        viewport={{ once: true, amount: 0.4 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        {STATEMENT}
      </motion.p>

      <motion.p
        className="mt-6 max-w-2xl text-sm font-normal leading-relaxed text-white/45 sm:text-base"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 1, delay: 0.15, ease }}
        viewport={{ once: true, amount: 0.4 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        {STATEMENT_SUB}
      </motion.p>
    </section>
  );
}
