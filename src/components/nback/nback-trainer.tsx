"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "position" | "letter" | "dual";
type Phase = "setup" | "countdown" | "playing" | "result";
type Trial = {
  position: number;
  letter: string;
  positionMatch: boolean;
  letterMatch: boolean;
};
type Response = {
  position: boolean;
  letter: boolean;
  reactionMs?: number;
};
type Result = {
  mode: Mode;
  nLevel: number;
  trials: number;
  accuracy: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  avgReaction: number;
  nextN: number;
};

const letters = ["A", "K", "M", "R", "S", "T", "F", "L"];
const modeLabels: Record<Mode, string> = {
  position: "九宫格",
  letter: "字母",
  dual: "双重",
};
const modeHints: Record<Mode, string> = {
  position: "判断当前亮格是否和 N 步前相同",
  letter: "判断当前字母是否和 N 步前相同",
  dual: "同时判断位置和字母两个维度",
};

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function createTrials(count: number, nLevel: number, mode: Mode): Trial[] {
  const trials: Trial[] = [];

  for (let index = 0; index < count; index += 1) {
    const canMatch = index >= nLevel;
    const shouldPositionMatch =
      canMatch && (mode === "position" || mode === "dual") && Math.random() < 0.32;
    const shouldLetterMatch =
      canMatch && (mode === "letter" || mode === "dual") && Math.random() < 0.32;

    let position = Math.floor(Math.random() * 9);
    let letter = randomItem(letters);

    if (shouldPositionMatch) {
      position = trials[index - nLevel].position;
    } else if (canMatch) {
      while (position === trials[index - nLevel].position) {
        position = Math.floor(Math.random() * 9);
      }
    }

    if (shouldLetterMatch) {
      letter = trials[index - nLevel].letter;
    } else if (canMatch) {
      while (letter === trials[index - nLevel].letter) {
        letter = randomItem(letters);
      }
    }

    trials.push({
      position,
      letter,
      positionMatch: canMatch && position === trials[index - nLevel]?.position,
      letterMatch: canMatch && letter === trials[index - nLevel]?.letter,
    });
  }

  return trials;
}

function evaluate(
  trials: Trial[],
  responses: Response[],
  mode: Mode,
  nLevel: number,
): Result {
  let correct = 0;
  let total = 0;
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  const reactionTimes: number[] = [];

  trials.forEach((trial, index) => {
    const response = responses[index] ?? { position: false, letter: false };
    const checks =
      mode === "dual"
        ? [
            { expected: trial.positionMatch, actual: response.position },
            { expected: trial.letterMatch, actual: response.letter },
          ]
        : [
            {
              expected: mode === "position" ? trial.positionMatch : trial.letterMatch,
              actual: mode === "position" ? response.position : response.letter,
            },
          ];

    checks.forEach(({ expected, actual }) => {
      total += 1;
      if (expected === actual) {
        correct += 1;
      }
      if (expected && actual) {
        hits += 1;
      }
      if (expected && !actual) {
        misses += 1;
      }
      if (!expected && actual) {
        falseAlarms += 1;
      }
    });

    if (response.reactionMs) {
      reactionTimes.push(response.reactionMs);
    }
  });

  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const avgReaction =
    reactionTimes.length === 0
      ? 0
      : Math.round(
          reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length,
        );

  return {
    mode,
    nLevel,
    trials: trials.length,
    accuracy,
    hits,
    misses,
    falseAlarms,
    avgReaction,
    nextN: accuracy >= 82 ? Math.min(nLevel + 1, 6) : accuracy < 62 ? Math.max(nLevel - 1, 1) : nLevel,
  };
}

export function NBackTrainer() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("dual");
  const [nLevel, setNLevel] = useState(2);
  const [roundLength, setRoundLength] = useState(24);
  const [paceMs, setPaceMs] = useState(1700);
  const [countdown, setCountdown] = useState(3);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastResult, setLastResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const shownAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTrial = trials[currentIndex];
  const progress = trials.length === 0 ? 0 : ((currentIndex + 1) / trials.length) * 100;

  const bestN = useMemo(
    () => Math.max(nLevel, ...history.map((item) => item.nLevel)),
    [history, nLevel],
  );
  const avgAccuracy = useMemo(() => {
    if (history.length === 0) {
      return 0;
    }
    return Math.round(
      history.reduce((sum, item) => sum + item.accuracy, 0) / history.length,
    );
  }, [history]);

  useEffect(() => {
    const stored = window.localStorage.getItem("nback-history");
    if (!stored) {
      return;
    }
    try {
      setHistory(JSON.parse(stored).slice(0, 6));
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (phase !== "countdown") {
      return undefined;
    }
    if (countdown === 0) {
      shownAtRef.current = performance.now();
      setPhase("playing");
      return undefined;
    }
    timerRef.current = setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 700);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown, phase]);

  useEffect(() => {
    if (phase !== "playing" || trials.length === 0) {
      return undefined;
    }

    shownAtRef.current = performance.now();
    timerRef.current = setTimeout(() => {
      advance();
    }, paceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, paceMs, phase, trials.length]);

  function startRound(nextN = nLevel) {
    const generated = createTrials(roundLength, nextN, mode);
    setNLevel(nextN);
    setTrials(generated);
    setResponses(generated.map(() => ({ position: false, letter: false })));
    setCurrentIndex(0);
    setCountdown(3);
    setLastResult(null);
    setPhase("countdown");
  }

  function finishRound(nextResponses = responses) {
    const result = evaluate(trials, nextResponses, mode, nLevel);
    const nextHistory = [result, ...history].slice(0, 6);
    setLastResult(result);
    setHistory(nextHistory);
    window.localStorage.setItem("nback-history", JSON.stringify(nextHistory));
    setPhase("result");
  }

  function advance(nextResponses = responses) {
    if (currentIndex >= trials.length - 1) {
      finishRound(nextResponses);
      return;
    }
    setCurrentIndex((value) => value + 1);
  }

  function answer(kind: "position" | "letter") {
    if (phase !== "playing") {
      return;
    }
    const reactionMs = Math.round(performance.now() - shownAtRef.current);
    const nextResponses = responses.map((response, index) =>
      index === currentIndex
        ? { ...response, [kind]: true, reactionMs: response.reactionMs ?? reactionMs }
        : response,
    );
    setResponses(nextResponses);
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#141414]">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/15 pb-4">
          <a
            className="text-xs uppercase tracking-[0.18em] text-black/50 transition hover:text-black"
            href="/"
          >
            chenmubai.cn
          </a>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-black/45">
            <span>Working Memory</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#d14b2f]" />
            <span>N-Back</span>
          </div>
        </header>

        <div className="grid flex-1 gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="flex min-h-[620px] flex-col justify-between rounded-lg border border-black/15 bg-[#fffaf0] p-4 shadow-[0_18px_60px_rgba(20,20,20,0.08)] sm:p-6">
            {phase === "setup" && (
              <SetupView
                avgAccuracy={avgAccuracy}
                bestN={bestN}
                mode={mode}
                nLevel={nLevel}
                paceMs={paceMs}
                roundLength={roundLength}
                setMode={setMode}
                setNLevel={setNLevel}
                setPaceMs={setPaceMs}
                setRoundLength={setRoundLength}
                startRound={() => startRound()}
              />
            )}

            {phase === "countdown" && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="mb-4 text-xs uppercase tracking-[0.2em] text-black/45">
                  {modeLabels[mode]} · {nLevel}-back
                </p>
                <div className="font-display text-[120px] leading-none text-[#d14b2f] sm:text-[180px]">
                  {countdown || "Go"}
                </div>
              </div>
            )}

            {phase === "playing" && currentTrial && (
              <PlayView
                currentIndex={currentIndex}
                currentTrial={currentTrial}
                mode={mode}
                nLevel={nLevel}
                onAnswer={answer}
                progress={progress}
                response={responses[currentIndex]}
                total={trials.length}
              />
            )}

            {phase === "result" && lastResult && (
              <ResultView
                result={lastResult}
                onAgain={() => startRound(lastResult.nextN)}
                onSetup={() => {
                  setNLevel(lastResult.nextN);
                  setPhase("setup");
                }}
              />
            )}
          </section>

          <aside className="rounded-lg border border-black/15 bg-[#151515] p-4 text-white sm:p-5">
            <div className="border-b border-white/10 pb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Today</p>
              <h2 className="mt-3 text-2xl">训练面板</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="最佳 N" value={String(bestN)} />
              <Metric label="平均准确率" value={avgAccuracy ? `${avgAccuracy}%` : "--"} />
              <Metric label="当前模式" value={modeLabels[mode]} />
              <Metric label="回合长度" value={String(roundLength)} />
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">
                最近成绩
              </p>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="rounded-md border border-white/10 p-4 text-sm leading-6 text-white/55">
                    完成第一轮后，这里会记录准确率、反应时间和下一轮推荐 N 值。
                  </p>
                ) : (
                  history.map((item, index) => (
                    <div
                      className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-white/10 p-3"
                      key={`${item.mode}-${item.nLevel}-${index}`}
                    >
                      <div>
                        <p className="text-sm">
                          {modeLabels[item.mode]} · {item.nLevel}-back
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {item.trials} 题 · {item.avgReaction || "--"} ms
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg text-[#f4c35b]">{item.accuracy}%</p>
                        <p className="text-xs text-white/45">Next {item.nextN}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SetupView({
  avgAccuracy,
  bestN,
  mode,
  nLevel,
  paceMs,
  roundLength,
  setMode,
  setNLevel,
  setPaceMs,
  setRoundLength,
  startRound,
}: {
  avgAccuracy: number;
  bestN: number;
  mode: Mode;
  nLevel: number;
  paceMs: number;
  roundLength: number;
  setMode: (mode: Mode) => void;
  setNLevel: (value: number) => void;
  setPaceMs: (value: number) => void;
  setRoundLength: (value: number) => void;
  startRound: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-black/45">Brain Trainer</p>
        <h1 className="mt-4 max-w-4xl text-5xl leading-[0.95] sm:text-7xl lg:text-8xl">
          Step N Back
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-black/60">
          一个短回合的工作记忆训练。记住前面第 N 步出现的位置或字母，在当前刺激匹配时立即点击对应按钮。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-black/45">
              模式
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["position", "letter", "dual"] as Mode[]).map((item) => (
                <button
                  className={`rounded-md border p-4 text-left transition ${
                    mode === item
                      ? "border-[#d14b2f] bg-[#d14b2f] text-white"
                      : "border-black/15 bg-white/55 hover:border-black/35"
                  }`}
                  key={item}
                  onClick={() => setMode(item)}
                  type="button"
                >
                  <span className="block text-lg">{modeLabels[item]}</span>
                  <span className={`mt-2 block text-xs leading-5 ${mode === item ? "text-white/75" : "text-black/50"}`}>
                    {modeHints[item]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <RangeControl
              label="N 值"
              max={6}
              min={1}
              onChange={setNLevel}
              suffix="-back"
              value={nLevel}
            />
            <RangeControl
              label="题数"
              max={48}
              min={16}
              onChange={setRoundLength}
              step={4}
              value={roundLength}
            />
            <RangeControl
              label="节奏"
              max={2600}
              min={900}
              onChange={setPaceMs}
              step={100}
              suffix="ms"
              value={paceMs}
            />
          </div>
        </div>

        <div className="rounded-lg border border-black/15 bg-[#141414] p-4 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Profile</p>
          <div className="mt-6 space-y-4">
            <Metric label="最佳 N" value={String(bestN)} />
            <Metric label="平均准确率" value={avgAccuracy ? `${avgAccuracy}%` : "--"} />
          </div>
          <button
            className="mt-6 w-full rounded-md bg-[#f4c35b] px-5 py-4 text-sm uppercase tracking-[0.16em] text-black transition hover:bg-[#ffd36c]"
            onClick={startRound}
            type="button"
          >
            开始训练
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayView({
  currentIndex,
  currentTrial,
  mode,
  nLevel,
  onAnswer,
  progress,
  response,
  total,
}: {
  currentIndex: number;
  currentTrial: Trial;
  mode: Mode;
  nLevel: number;
  onAnswer: (kind: "position" | "letter") => void;
  progress: number;
  response?: Response;
  total: number;
}) {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <div>
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-black/45">
          <span>
            {modeLabels[mode]} · {nLevel}-back
          </span>
          <span>
            {currentIndex + 1}/{total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-[#d14b2f] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid flex-1 place-items-center gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="grid aspect-square w-full max-w-[520px] grid-cols-3 gap-3 rounded-lg border border-black/15 bg-[#ece3d4] p-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              className={`grid place-items-center rounded-md border transition ${
                currentTrial.position === index
                  ? "border-[#d14b2f] bg-[#d14b2f] text-white shadow-[0_16px_30px_rgba(209,75,47,0.3)]"
                  : "border-black/10 bg-[#fffaf0]"
              }`}
              key={index}
            >
              {currentTrial.position === index && mode !== "position" ? (
                <span className="text-5xl sm:text-7xl">{currentTrial.letter}</span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="w-full space-y-3">
          {mode !== "letter" && (
            <AnswerButton
              active={Boolean(response?.position)}
              label="位置匹配"
              onClick={() => onAnswer("position")}
            />
          )}
          {mode !== "position" && (
            <AnswerButton
              active={Boolean(response?.letter)}
              label="字母匹配"
              onClick={() => onAnswer("letter")}
            />
          )}
          <div className="rounded-md border border-black/15 bg-white/50 p-4 text-sm leading-6 text-black/55">
            当前刺激出现后，如果它和前面第 {nLevel} 步相同，就点击对应按钮。
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultView({
  onAgain,
  onSetup,
  result,
}: {
  onAgain: () => void;
  onSetup: () => void;
  result: Result;
}) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-black/45">Round Complete</p>
        <h1 className="mt-4 text-5xl sm:text-7xl">{result.accuracy}%</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-black/60">
          {result.accuracy >= 82
            ? `表现稳定，下一轮推荐升到 ${result.nextN}-back。`
            : result.accuracy < 62
              ? `这轮负荷偏高，下一轮推荐回到 ${result.nextN}-back。`
              : `难度合适，下一轮继续保持 ${result.nextN}-back。`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        <ScoreTile label="命中" value={result.hits} />
        <ScoreTile label="漏判" value={result.misses} />
        <ScoreTile label="误判" value={result.falseAlarms} />
        <ScoreTile label="反应" value={result.avgReaction ? `${result.avgReaction}ms` : "--"} />
        <ScoreTile label="推荐" value={`${result.nextN}-back`} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="rounded-md bg-[#d14b2f] px-6 py-4 text-sm uppercase tracking-[0.16em] text-white transition hover:bg-[#bb3f27]"
          onClick={onAgain}
          type="button"
        >
          按推荐再来
        </button>
        <button
          className="rounded-md border border-black/20 px-6 py-4 text-sm uppercase tracking-[0.16em] text-black transition hover:bg-black hover:text-white"
          onClick={onSetup}
          type="button"
        >
          调整设置
        </button>
      </div>
    </div>
  );
}

function AnswerButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`h-20 w-full rounded-md border px-5 text-left text-lg transition ${
        active
          ? "border-[#d14b2f] bg-[#d14b2f] text-white"
          : "border-black/15 bg-[#fffaf0] hover:border-black/35"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  step = 1,
  suffix = "",
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  value: number;
}) {
  return (
    <label className="rounded-lg border border-black/15 bg-white/55 p-4">
      <span className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-black/45">{label}</span>
        <span className="text-sm">
          {value}
          {suffix}
        </span>
      </span>
      <input
        className="mt-5 w-full accent-[#d14b2f]"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="mt-2 text-xl text-white">{value}</p>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-black/15 bg-white/55 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-black/45">{label}</p>
      <p className="mt-3 text-2xl">{value}</p>
    </div>
  );
}
