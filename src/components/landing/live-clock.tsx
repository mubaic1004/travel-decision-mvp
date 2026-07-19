"use client";

import { useEffect, useState } from "react";

const makeFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone,
  });

const shanghai = makeFormatter("Asia/Shanghai");
const sanFrancisco = makeFormatter("America/Los_Angeles");

// Live times for the two cities I split my time between, ticking once per second.
export function LiveClock() {
  const [times, setTimes] = useState<{ sh: string; sf: string } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimes({ sh: shanghai.format(now), sf: sanFrancisco.format(now) });
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span
      aria-label="当前上海与旧金山时间"
      className="block text-right leading-relaxed tracking-[0.12em] tabular-nums text-white/40 transition-opacity"
      style={{ opacity: times ? 1 : 0 }}
    >
      <span className="block whitespace-nowrap">SHANGHAI · {times?.sh ?? "00:00:00"}</span>
      <span className="block whitespace-nowrap">SAN FRANCISCO · {times?.sf ?? "00:00:00"}</span>
    </span>
  );
}
