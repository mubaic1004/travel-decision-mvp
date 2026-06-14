"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

// Aristide-style cursor follower. Hides on touch devices, expands when
// hovering interactive elements.
export function CursorFollower() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 420, damping: 32, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 420, damping: 32, mass: 0.4 });

  const [isTouch, setIsTouch] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setIsTouch(!supportsHover);
    if (!supportsHover) return;

    function handleMove(event: PointerEvent) {
      x.set(event.clientX);
      y.set(event.clientY);
    }
    function handleOver(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest("a, button, [data-cursor-hover]");
      setIsHovering(Boolean(interactive));
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerover", handleOver);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerover", handleOver);
    };
  }, [x, y]);

  if (isTouch) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] mix-blend-difference"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
      }}
    >
      <motion.div
        animate={{
          width: isHovering ? 44 : 10,
          height: isHovering ? 44 : 10,
          backgroundColor: isHovering ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,1)",
        }}
        className="rounded-full"
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      />
    </motion.div>
  );
}
