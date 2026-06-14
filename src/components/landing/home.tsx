"use client";

import { motion } from "motion/react";

import { CursorFollower } from "@/components/landing/cursor-follower";
import { LiveClock } from "@/components/landing/live-clock";
import { ProjectRow } from "@/components/landing/project-row";

interface Project {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  year: string;
  status: string;
}

const projects: Project[] = [
  {
    id: "01",
    title: "旅行规划助手",
    subtitle: "最省钱、最省假、最划算 —— 三种方案，挑一个就行。",
    href: "/travel",
    year: "2026",
    status: "在线",
  },
];

// Staggered reveal sequence. Easing tuned to feel slow and confident,
// not snappy. Aristide's defaults are around 700-900ms with similar easing.
const ease = [0.22, 1, 0.36, 1] as const;

export function Home() {
  return (
    <main className="min-h-screen">
      <CursorFollower />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-12 pt-10 sm:px-10 sm:pt-14 lg:px-14">
        <motion.nav
          animate={{ opacity: 1, y: 0 }}
          className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.34em] text-stone-500"
          initial={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.8, ease }}
        >
          <span>chenmubai.cn</span>
          <span className="normal-case tracking-normal">
            <LiveClock />
          </span>
        </motion.nav>

        <header className="mt-24 sm:mt-36 lg:mt-44">
          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="font-serif-display text-[3.4rem] font-light leading-[0.92] tracking-tight text-stone-950 sm:text-[6rem] lg:text-[8rem]"
            initial={{ opacity: 0, y: 36 }}
            transition={{ duration: 1.1, delay: 0.2, ease }}
          >
            陈慕白
          </motion.h1>
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="font-serif-display mt-8 max-w-2xl text-xl font-light leading-[1.55] text-stone-700 sm:text-2xl lg:text-[1.75rem]"
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 1, delay: 0.5, ease }}
          >
            业余时间做些
            <span className="font-serif-italic mx-1.5 text-stone-950">小工具</span>
            和
            <span className="font-serif-italic mx-1.5 text-stone-950">小想法</span>
            。
          </motion.p>
        </header>

        <motion.section
          animate={{ opacity: 1 }}
          className="mt-24 sm:mt-40 lg:mt-52"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease }}
        >
          <div className="mb-6 flex items-baseline justify-between text-[11px] uppercase tracking-[0.34em] text-stone-500 sm:mb-10">
            <span>小工具</span>
            <span className="font-serif-italic normal-case tracking-normal text-stone-400">
              selected works
            </span>
          </div>

          <ul className="border-t border-stone-300/60">
            {projects.map((project, index) => (
              <ProjectRow index={index} key={project.id} project={project} />
            ))}
          </ul>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="font-serif-italic mt-10 text-sm text-stone-400 sm:mt-14 sm:text-base"
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.8, delay: 1.2, ease }}
          >
            更多想法陆续上线 ——
          </motion.p>
        </motion.section>

        <div className="flex-1" />

        <motion.div
          animate={{ opacity: 1 }}
          className="mt-16 flex flex-wrap items-baseline justify-between gap-2 text-[11px] uppercase tracking-[0.32em] text-stone-400 sm:mt-24"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: 1.4, ease }}
        >
          <span className="font-serif-italic">made slowly · in shanghai</span>
          <span className="font-serif-italic normal-case tracking-normal text-stone-400">
            v2.0 · 2026
          </span>
        </motion.div>
      </div>
    </main>
  );
}
