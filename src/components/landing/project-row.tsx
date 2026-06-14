"use client";

import { motion, useInView } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";

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
      className="border-b border-stone-300/60"
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
          animate={{ color: hovered ? "#1c1917" : "#a8a29e" }}
          className="font-serif-display w-10 text-sm sm:text-base"
          transition={{ duration: 0.4 }}
        >
          {project.id}
        </motion.span>

        <div className="relative">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <motion.h2
              animate={{ x: hovered ? 14 : 0 }}
              className="font-serif-display text-3xl font-light leading-[1.05] text-stone-950 sm:text-5xl lg:text-[3.6rem]"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {project.title}
            </motion.h2>
            <motion.span
              animate={{ opacity: hovered ? 0.3 : 1 }}
              className="font-serif-italic text-xs text-stone-400 sm:text-sm"
              transition={{ duration: 0.4 }}
            >
              {project.year} · {project.status}
            </motion.span>
          </div>

          <motion.p
            animate={{ x: hovered ? 14 : 0, opacity: hovered ? 0.7 : 1 }}
            className="font-serif-display mt-3 max-w-xl text-sm font-light leading-relaxed text-stone-600 sm:mt-4 sm:text-base"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {project.subtitle}
          </motion.p>
        </div>

        <motion.span
          animate={{
            x: hovered ? 8 : 0,
            color: hovered ? "#1c1917" : "#a8a29e",
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
          className="pointer-events-none absolute inset-x-[-20px] inset-y-0 -z-10 origin-left rounded-2xl bg-stone-100/60"
          initial={false}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </Link>
    </motion.li>
  );
}
