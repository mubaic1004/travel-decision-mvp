"use client";

import { motion, useInView } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";

import { ScrambleText } from "@/components/fx/scramble-text";

interface Project {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  year: string;
  status: string;
}

interface ProjectRowProps {
  project: Project;
  index: number;
}

export function ProjectRow({ project, index }: ProjectRowProps) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.li
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      className="border-b border-white/10"
      initial={{ opacity: 0, y: 28 }}
      ref={ref}
      transition={{ duration: 0.7, delay: 0.1 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        className="group relative grid grid-cols-[auto_1fr_auto] items-baseline gap-5 py-7 sm:gap-10 sm:py-10"
        href={project.href}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <motion.span
          animate={{ color: hovered ? "#ffffff" : "rgba(255,255,255,0.3)" }}
          className="w-10 text-xs uppercase tracking-[0.15em] sm:text-sm"
          transition={{ duration: 0.4 }}
        >
          {project.id}
        </motion.span>

        <div className="relative">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <motion.h2
              animate={{ x: hovered ? 14 : 0 }}
              className="text-2xl font-normal leading-[1.05] tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <ScrambleText isHovered={hovered} text={project.title} />
            </motion.h2>
            <motion.span
              animate={{ opacity: hovered ? 0.35 : 0.55 }}
              className="text-[11px] uppercase tracking-[0.15em] text-white/55 sm:text-xs"
              transition={{ duration: 0.4 }}
            >
              {project.year} · {project.status}
            </motion.span>
          </div>

          <motion.p
            animate={{ x: hovered ? 14 : 0, opacity: hovered ? 0.85 : 0.5 }}
            className="mt-3 max-w-xl text-[13px] font-normal leading-relaxed text-white/50 sm:mt-4 sm:text-sm"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {project.subtitle}
          </motion.p>
        </div>

        <motion.span
          animate={{
            x: hovered ? 8 : 0,
            color: hovered ? "#ffffff" : "rgba(255,255,255,0.3)",
          }}
          className="self-center text-2xl sm:text-3xl"
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          →
        </motion.span>

        {/* Hover background sweep */}
        <motion.div
          animate={{ scaleX: hovered ? 1 : 0 }}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[-20px] inset-y-0 -z-10 origin-left rounded-xl bg-white/[0.04]"
          initial={false}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </Link>
    </motion.li>
  );
}
