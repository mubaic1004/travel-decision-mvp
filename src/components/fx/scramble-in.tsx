"use client";

import { useEffect, useRef, useState } from "react";

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

interface ScrambleInProps {
  text: string;
  delay?: number;
  triggered?: boolean;
  className?: string;
}

// Entrance reveal: characters resolve left-to-right out of random noise.
export function ScrambleIn({
  text,
  delay = 0,
  triggered = true,
  className,
}: ScrambleInProps) {
  const [display, setDisplay] = useState<string>("");
  const [started, setStarted] = useState(false);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!triggered) return;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const startTimer = setTimeout(() => {
      setStarted(true);
      frameRef.current = 0;
      intervalId = setInterval(() => {
        frameRef.current += 0.5;
        const revealed = frameRef.current;
        let output = "";
        for (let i = 0; i < text.length; i += 1) {
          if (text[i] === " ") {
            output += " ";
          } else if (i < revealed) {
            output += text[i];
          } else if (i < revealed + 3) {
            output += randomChar();
          }
        }
        setDisplay(output);
        if (revealed >= text.length) {
          setDisplay(text);
          if (intervalId) clearInterval(intervalId);
        }
      }, 25);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, delay, triggered]);

  if (!triggered || (!started && display === "")) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: "&nbsp;" }} />;
  }

  return <span className={className}>{display}</span>;
}
