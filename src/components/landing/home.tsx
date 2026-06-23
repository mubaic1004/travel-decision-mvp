"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { CursorFollower } from "@/components/landing/cursor-follower";
import { LiveClock } from "@/components/landing/live-clock";
import { ProjectRow } from "@/components/landing/project-row";
import { ScrambleIn } from "@/components/fx/scramble-in";

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
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Home() {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#010103]">
      <CursorFollower />

      {/* Animated background + texture */}
      <div className="aurora-bg pointer-events-none absolute inset-0" />
      <div className="dot-grid pointer-events-none absolute inset-0" />

      {/* Giant watermark */}
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

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-12 pt-10 sm:px-10 sm:pt-14 lg:px-14">
        <motion.nav
          animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -8 }}
          className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.28em] text-white/45"
          transition={{ duration: 0.8, ease }}
        >
          <span>CHENMUBAI.CN</span>
          <span>
            <LiveClock />
          </span>
        </motion.nav>

        <motion.header
          animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 10 }}
          className="mt-4 max-w-md"
          transition={{ duration: 0.9, delay: 0.4, ease }}
        >
          <h1 className="text-base font-normal lowercase tracking-tight text-white/90 sm:text-lg">
            <ScrambleIn delay={300} text="mubai's main site" triggered={entered} />
          </h1>
          <p className="mt-2 text-sm font-normal leading-relaxed text-white/45">
            业余时间做些小工具和小想法。Built slowly, in Shanghai.
          </p>
        </motion.header>

        <motion.section
          animate={{ opacity: entered ? 1 : 0 }}
          className="mt-24 sm:mt-40 lg:mt-52"
          transition={{ duration: 0.8, delay: 0.9, ease }}
        >
          <div className="mb-6 flex items-baseline justify-between text-[11px] uppercase tracking-[0.28em] text-white/40 sm:mb-10">
            <span>小工具 / TOOLS</span>
            <span className="text-white/30">SELECTED WORKS</span>
          </div>

          <ul className="border-t border-white/10">
            {projects.map((project, index) => (
              <ProjectRow index={index} key={project.id} project={project} />
            ))}
          </ul>

          <motion.p
            animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 12 }}
            className="mt-10 text-[11px] uppercase tracking-[0.2em] text-white/30 sm:mt-14"
            transition={{ duration: 0.8, delay: 1.2, ease }}
          >
            更多想法陆续上线 — MORE SOON
          </motion.p>
        </motion.section>

        <div className="flex-1" />

        <motion.div
          animate={{ opacity: entered ? 1 : 0 }}
          className="mt-16 flex flex-wrap items-baseline justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-white/30 sm:mt-24"
          transition={{ duration: 0.8, delay: 1.4, ease }}
        >
          <span>MADE SLOWLY · IN SHANGHAI</span>
          <span>V2.5 · 2026</span>
        </motion.div>
      </div>
    </main>
  );
}
