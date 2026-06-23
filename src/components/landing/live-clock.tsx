"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Shanghai",
});

// Live Shanghai time, ticking once per second.
export function LiveClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(formatter.format(new Date()));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span
      aria-label="当前上海时间"
      className="tabular-nums text-white/40 transition-opacity"
      style={{ opacity: time ? 1 : 0 }}
    >
      SHANGHAI · {time ?? "00:00:00"}
    </span>
  );
}
