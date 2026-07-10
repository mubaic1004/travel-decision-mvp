"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { AboutSection } from "@/components/landing/about-section";
import { AnniversaryTakeover } from "@/components/landing/anniversary-takeover";
import { CursorFollower } from "@/components/landing/cursor-follower";
import { LiveClock } from "@/components/landing/live-clock";
import { NotesSection } from "@/components/landing/notes-section";
import { NowSection } from "@/components/landing/now-section";
import { ProjectRow } from "@/components/landing/project-row";
import { StatsSection } from "@/components/landing/stats-section";

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
    status: "ONLINE",
  },
  {
    id: "02",
    title: "手绘转 CAD",
    subtitle: "上传手绘工程图，浏览器就地识别成矢量几何并导出 DXF。",
    href: "/handdraw",
    year: "2026",
    status: "ONLINE",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Home() {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative overflow-hidden bg-[#010103]">
      <AnniversaryTakeover />
      <CursorFollower />

      {/* Fixed background + texture spanning the whole scroll */}
      <div className="aurora-bg pointer-events-none fixed inset-0" />
      <div className="dot-grid pointer-events-none fixed inset-0" />

      <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-14">
        {/* ── HERO (first viewport) ── */}
        <section className="relative flex min-h-screen flex-col pb-12 pt-10 sm:pt-14">
          {/* Giant watermark, confined to the hero */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <span
              className="font-display select-none whitespace-nowrap uppercase leading-none"
              style={{
                fontSize: "clamp(120px, 26vw, 460px)",
                letterSpacing: "-0.04em",
                transform: "translateY(40px)",
                backgroundImage:
                  "radial-gradient(circle, rgba(142,127,148,0) 0%, #8E7F94 70%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                opacity: 0.1,
              }}
            >
              MUBAI
            </span>
          </div>

          <motion.nav
            animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -8 }}
            className="relative flex items-baseline justify-between text-[11px] uppercase tracking-[0.28em] text-white/45"
            transition={{ duration: 0.8, ease }}
          >
            <span>CHENMUBAI.CN</span>
            <span>
              <LiveClock />
            </span>
          </motion.nav>

          <motion.header
            animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 10 }}
            className="relative mt-4 max-w-md"
            transition={{ duration: 0.9, delay: 0.4, ease }}
          >
            <h1 className="sr-only">陈慕白 · chenmubai</h1>
            <p className="text-sm font-normal leading-relaxed text-white/45">
              业余时间做些小工具和小想法。Built slowly, in Shanghai.
            </p>
          </motion.header>

          <div className="flex-1" />

          <motion.div
            animate={{ opacity: entered ? 1 : 0 }}
            className="relative flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/30"
            transition={{ duration: 0.8, delay: 1, ease }}
          >
            <span>向下滚动</span>
            <span className="h-px w-12 bg-white/20" />
            <span>SCROLL</span>
          </motion.div>
        </section>

        <AboutSection />

        {/* ── TOOLS ── */}
        <section className="border-t border-white/10 py-20 sm:py-28" id="tools">
          <div className="mb-6 flex items-baseline justify-between text-[11px] uppercase tracking-[0.28em] text-white/40 sm:mb-10">
            <span>小工具 / TOOLS</span>
            <span className="text-white/25">02</span>
          </div>

          <ul className="border-t border-white/10">
            {projects.map((project, index) => (
              <ProjectRow index={index} key={project.id} project={project} />
            ))}
          </ul>

          <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-white/30 sm:mt-14">
            更多想法陆续上线 — MORE SOON
          </p>
        </section>

        <StatsSection />
        <NowSection />
        <NotesSection />

        {/* ── bottom bar ── */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-white/10 py-10 text-[11px] uppercase tracking-[0.22em] text-white/30">
          <span>MADE SLOWLY · IN SHANGHAI</span>
          <span>V2.6 · 2026</span>
        </div>
      </div>
    </main>
  );
}
