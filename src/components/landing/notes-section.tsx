"use client";

import { motion } from "motion/react";

// ── 改这里：小想法（想发就加一条，最新放最上面）─────────
const NOTES = [
  { text: "做完才发现，备案比写代码难得多。", date: "2026.06" },
  { text: "工具不用做大。能解决自己一个具体的麻烦，就值了。", date: "2026.06" },
  { text: "和 AI 一起写代码最大的变化：我开始敢碰那些我本来不会的东西。", date: "2026.05" },
];
// ───────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

export function NotesSection() {
  return (
    <section className="border-t border-white/10 py-20 sm:py-28" id="notes">
      <div className="mb-12 flex items-baseline justify-between text-[11px] uppercase tracking-[0.28em] text-white/40 sm:mb-16">
        <span>想法 / NOTES</span>
        <span className="text-white/25">04</span>
      </div>

      <div className="space-y-10">
        {NOTES.map((note, index) => (
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            key={note.text}
            transition={{ duration: 0.7, delay: index * 0.08, ease }}
            viewport={{ once: true, amount: 0.5 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="text-lg font-normal leading-relaxed text-white/90 sm:text-xl">
              “{note.text}”
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/30">
              {note.date}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
