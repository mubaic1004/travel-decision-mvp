"use client";

import { useEffect, useRef, useState } from "react";

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

interface ScrambleTextProps {
  text: string;
  isHovered: boolean;
  className?: string;
}

// Hover-driven scramble: on hover, all chars scramble then resolve
// left-to-right (4 frames per char). On unhover, snaps back instantly.
export function ScrambleText({ text, isHovered, className }: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplay(text);
      return;
    }

    let frame = 0;
    intervalRef.current = setInterval(() => {
      frame += 1;
      const revealed = frame / 4;
      let output = "";
      for (let i = 0; i < text.length; i += 1) {
        if (text[i] === " ") {
          output += " ";
        } else if (i < revealed) {
          output += text[i];
        } else {
          output += randomChar();
        }
      }
      setDisplay(output);
      if (revealed >= text.length) {
        setDisplay(text);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 25);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, text]);

  return <span className={className}>{display}</span>;
}
