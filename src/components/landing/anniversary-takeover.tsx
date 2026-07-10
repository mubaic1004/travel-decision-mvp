"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { ScrambleIn } from "@/components/fx/scramble-in";

// ── 改这里：给皮皮的话（想改文案只动这一块）─────────────
const DATE_RANGE = "2020.07.10 — 2026.07.10";
const LINES = [
  "皮皮：",
  "结婚六周年快乐。",
  "谢谢你陪我走过第六年，",
  "以及接下来的每一年。",
  "我们会越来越好的。",
];
const SIGNATURE = "—— 瓜瓜";
const ANNIVERSARY = "2026-07-10"; // 这一天首页自动展示（看的人本地时区或上海时区任一命中即可）
// ───────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;
const LINE_DELAY_BASE = 1400;
const LINE_DELAY_STEP = 1200;

const HEARTS = [
  { left: "5%", size: 13, duration: 15, delay: 0, opacity: 0.35 },
  { left: "14%", size: 18, duration: 12, delay: 3.5, opacity: 0.45 },
  { left: "24%", size: 11, duration: 17, delay: 1.5, opacity: 0.3 },
  { left: "33%", size: 15, duration: 13, delay: 6, opacity: 0.4 },
  { left: "45%", size: 12, duration: 16, delay: 2.5, opacity: 0.3 },
  { left: "55%", size: 20, duration: 11, delay: 5, opacity: 0.5 },
  { left: "64%", size: 13, duration: 14, delay: 0.8, opacity: 0.35 },
  { left: "73%", size: 16, duration: 12.5, delay: 4, opacity: 0.45 },
  { left: "82%", size: 11, duration: 16.5, delay: 7, opacity: 0.3 },
  { left: "91%", size: 15, duration: 13.5, delay: 2, opacity: 0.4 },
];

interface AnniversaryTakeoverProps {
  /** true 时无视日期直接展示（/pipi 永久页用） */
  force?: boolean;
}

export function AnniversaryTakeover({ force = false }: AnniversaryTakeoverProps) {
  const [visible, setVisible] = useState(false);
  const [buttonReady, setButtonReady] = useState(false);

  useEffect(() => {
    const now = new Date();
    const shanghaiToday = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
    }).format(now);
    const localToday = new Intl.DateTimeFormat("en-CA").format(now);
    const forcedByQuery =
      new URLSearchParams(window.location.search).get("pipi") === "1";
    if (
      force ||
      forcedByQuery ||
      shanghaiToday === ANNIVERSARY ||
      localToday === ANNIVERSARY
    ) {
      setVisible(true);
    }
  }, [force]);

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(
      () => setButtonReady(true),
      LINE_DELAY_BASE + (LINES.length + 1) * LINE_DELAY_STEP + 600,
    );
    return () => {
      document.body.style.overflow = "";
      clearTimeout(timer);
    };
  }, [visible]);

  const handleEnter = () => {
    if (force) {
      window.location.href = "/";
      return;
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[60] overflow-hidden"
          exit={{ opacity: 0 }}
          initial={{ opacity: 1 }}
          transition={{ duration: 0.9, ease }}
        >
          <div className="aurora-warm absolute inset-0" />
          <div className="dot-grid absolute inset-0" />

          {/* 上浮的心 */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {HEARTS.map((heart, index) => (
              <span
                className="float-heart select-none"
                key={index}
                style={
                  {
                    left: heart.left,
                    fontSize: heart.size,
                    animationDuration: `${heart.duration}s`,
                    animationDelay: `${heart.delay}s`,
                    "--heart-o": heart.opacity,
                  } as React.CSSProperties
                }
              >
                ♥
              </span>
            ))}
          </div>

          {/* 巨型水印，仿首页 MUBAI 手法但换暖色 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span
              className="font-display select-none whitespace-nowrap uppercase leading-none"
              style={{
                fontSize: "clamp(64px, 15vw, 280px)",
                letterSpacing: "-0.03em",
                backgroundImage:
                  "radial-gradient(circle, rgba(216,146,156,0) 0%, #D8929C 70%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                opacity: 0.13,
              }}
            >
              SIX YEARS
            </span>
          </div>

          <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] uppercase tracking-[0.32em] text-white/45"
              initial={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.8, delay: 0.4, ease }}
            >
              {DATE_RANGE}
            </motion.p>

            <div className="mt-10 space-y-4 sm:mt-12 sm:space-y-5">
              {LINES.map((line, index) => (
                <p
                  className="text-lg leading-relaxed text-white/90 sm:text-2xl"
                  key={line}
                >
                  <ScrambleIn
                    delay={LINE_DELAY_BASE + index * LINE_DELAY_STEP}
                    text={line}
                  />
                </p>
              ))}
              <p className="pt-2 text-base text-white/45 sm:text-lg">
                <ScrambleIn
                  delay={LINE_DELAY_BASE + LINES.length * LINE_DELAY_STEP}
                  text={SIGNATURE}
                />
              </p>
            </div>

            <motion.div
              animate={{
                opacity: buttonReady ? 1 : 0,
                y: buttonReady ? 0 : 10,
              }}
              className="mt-12 sm:mt-16"
              initial={false}
              style={{ pointerEvents: buttonReady ? "auto" : "none" }}
              transition={{ duration: 0.8, ease }}
            >
              <button
                className="primary-button text-xs uppercase tracking-[0.18em]"
                onClick={handleEnter}
                type="button"
              >
                进入首页 / ENTER →
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
