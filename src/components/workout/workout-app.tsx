"use client";

import Image from "next/image";

import "./workout.css";
import { useEffect, useMemo, useState } from "react";
import {
  type EquipmentId,
  type Level,
  type MuscleId,
} from "@/lib/workout/exercise-data";
import { EXERCISE_DEMOS, getExerciseDemo } from "@/lib/workout/exercise-media";
import {
  generateWorkout,
  replaceExercise,
  type WorkoutDuration,
  type WorkoutOptions,
  type WorkoutPlanItem,
} from "@/lib/workout/workout-generator";
import {
  formatRelativeDate,
  muscleCoverage,
  normalizeSessions,
  recentExerciseIds,
  weeklySummary,
  type FavoritePlan,
  type WorkoutSession,
} from "@/lib/workout/progress-utils";

type Screen =
  | "muscle"
  | "setup"
  | "plan"
  | "workout"
  | "done"
  | "insights"
  | "demos";

type SyncState = "loading" | "synced" | "offline";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const MUSCLES: Array<{
  id: MuscleId;
  label: string;
  en: string;
  note: string;
  glyph: string;
}> = [
  { id: "chest", label: "胸肌", en: "CHEST", note: "推力与轮廓", glyph: "胸" },
  { id: "back", label: "背部", en: "BACK", note: "宽度与姿态", glyph: "背" },
  { id: "shoulders", label: "肩部", en: "SHOULDERS", note: "肩线与稳定", glyph: "肩" },
  { id: "arms", label: "手臂", en: "ARMS", note: "二头与三头", glyph: "臂" },
  { id: "core", label: "核心", en: "CORE", note: "躯干与控制", glyph: "核" },
  { id: "legs", label: "腿部", en: "LEGS", note: "力量与耐力", glyph: "腿" },
  { id: "glutes", label: "臀部", en: "GLUTES", note: "髋部与后链", glyph: "臀" },
  { id: "full", label: "全身", en: "FULL BODY", note: "一次练到位", glyph: "全" },
];

const EQUIPMENT: Array<{
  id: EquipmentId;
  label: string;
  short: string;
}> = [
  { id: "bodyweight", label: "徒手", short: "无需器械" },
  { id: "dumbbell", label: "哑铃", short: "Dumbbell" },
  { id: "barbell", label: "杠铃", short: "Barbell" },
  { id: "cable", label: "绳索器械", short: "Cable" },
  { id: "band", label: "弹力带", short: "Band" },
  { id: "kettlebell", label: "壶铃", short: "Kettlebell" },
];

const DURATIONS: WorkoutDuration[] = [15, 30, 45, 60];

const ROLE_LABELS: Record<WorkoutPlanItem["role"], string> = {
  warmup: "热身启动",
  main: "主力动作",
  accessory: "辅助训练",
  finisher: "收尾燃尽",
};

const SCREEN_STEP: Record<Screen, number> = {
  muscle: 1,
  setup: 2,
  plan: 3,
  workout: 3,
  done: 3,
  insights: 1,
  demos: 1,
};

const levelLabel = (level: Level) =>
  level === "beginner" ? "轻松上手" : "有点挑战";

const equipmentLabel = (id: EquipmentId) =>
  EQUIPMENT.find((item) => item.id === id)?.label ?? id;

const muscleLabel = (id: MuscleId) =>
  MUSCLES.find((item) => item.id === id)?.label ?? id;

const makeId = (prefix: string) =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const normalizeFavorites = (value: unknown): FavoritePlan[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    const conditions =
      record.conditions &&
      typeof record.conditions === "object" &&
      !Array.isArray(record.conditions)
        ? (record.conditions as Record<string, unknown>)
        : record;
    const id = typeof record.id === "string" ? record.id : "";
    const plan = Array.isArray(record.plan) ? record.plan : [];
    const muscles = Array.isArray(record.muscles)
      ? record.muscles
      : conditions.muscles;
    const equipment = Array.isArray(record.equipment)
      ? record.equipment
      : conditions.equipment;
    const duration = Number(record.duration ?? conditions.duration);
    const level = record.level ?? conditions.level;
    const createdAt = record.createdAt ?? record.date;
    const name = record.name ?? conditions.name;

    if (
      !id ||
      plan.length === 0 ||
      !Array.isArray(muscles) ||
      !Array.isArray(equipment) ||
      !DURATIONS.includes(duration as WorkoutDuration) ||
      (level !== "beginner" && level !== "intermediate")
    ) {
      return [];
    }

    const parsedDate = new Date(
      typeof createdAt === "string" ? createdAt : Date.now(),
    );

    return [{
      id,
      name:
        typeof name === "string" && name.trim()
          ? name
          : `${(muscles as MuscleId[]).map(muscleLabel).join(" · ")} · ${duration}分钟`,
      muscles: muscles as MuscleId[],
      duration: duration as WorkoutDuration,
      level,
      equipment: equipment as EquipmentId[],
      plan: plan as WorkoutPlanItem[],
      createdAt: Number.isFinite(parsedDate.getTime())
        ? parsedDate.toISOString()
        : new Date().toISOString(),
    }];
  });
};

const sortSessions = (sessions: WorkoutSession[]) =>
  [...sessions].sort(
    (left, right) =>
      new Date(right.date).getTime() - new Date(left.date).getTime(),
  );

const syncLabel: Record<SyncState, string> = {
  loading: "保存中",
  synced: "已存在本机",
  offline: "保存失败",
};

// 记录只写浏览器 localStorage，没有账号也没有云端。
// 换设备或清了浏览器数据就会从头开始。
const readLocal = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeLocal = (key: string, value: string): boolean => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export function WorkoutApp() {
  return (
    <div className="liannaar-root">
      <WorkoutScreens />
    </div>
  );
}

function WorkoutScreens() {
  const [screen, setScreen] = useState<Screen>("muscle");
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleId[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentId[]>([
    "bodyweight",
    "dumbbell",
  ]);
  const [duration, setDuration] = useState<WorkoutDuration>(30);
  const [level, setLevel] = useState<Level>("beginner");
  const [seed, setSeed] = useState(() => Date.now());
  const [plan, setPlan] = useState<WorkoutPlanItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restSeconds, setRestSeconds] = useState(0);
  const [toast, setToast] = useState("");
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [favorites, setFavorites] = useState<FavoritePlan[]>([]);
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const avoidedExerciseIds = useMemo(
    () => recentExerciseIds(history, 3),
    [history],
  );

  const options = useMemo<WorkoutOptions>(
    () => ({
      muscles: selectedMuscles,
      equipment: selectedEquipment,
      duration,
      level,
      seed,
      avoidExerciseIds: avoidedExerciseIds,
    }),
    [
      avoidedExerciseIds,
      duration,
      level,
      seed,
      selectedEquipment,
      selectedMuscles,
    ],
  );

  const currentItem = plan[currentIndex];
  const selectedMuscleNames = selectedMuscles.map(muscleLabel).join(" · ");
  const totalSets = plan.reduce((sum, item) => sum + item.sets, 0);
  const week = useMemo(() => weeklySummary(history), [history]);
  const coverage = useMemo(() => muscleCoverage(history), [history]);
  const maxDayMinutes = Math.max(
    1,
    ...week.days.map((day) => day.minutes),
  );
  const latestSession = history[0];
  const currentEffort =
    history.find((session) => session.id === currentSessionId)?.effort ?? null;
  const isCurrentPlanSaved = favorites.some(
    (favorite) =>
      favorite.plan.map((item) => item.exercise.id).join(",") ===
      plan.map((item) => item.exercise.id).join(","),
  );

  useEffect(() => {
    let active = true;

    const cachedHistory = sortSessions(
      normalizeSessions(readLocal("liannaar-history")),
    );
    let cachedFavorites: FavoritePlan[] = [];
    try {
      cachedFavorites = normalizeFavorites(
        JSON.parse(readLocal("liannaar-favorites") ?? "[]") as unknown,
      );
    } catch {
      cachedFavorites = [];
    }
    const hydrationTimer = window.setTimeout(() => {
      if (!active) return;
      setHistory(cachedHistory);
      setFavorites(cachedFavorites);
      setSyncState("synced");
    }, 0);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    return () => {
      active = false;
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (restSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRestSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [restSeconds]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const moveTo = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleMuscle = (id: MuscleId) => {
    setSelectedMuscles((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (id === "full") return ["full"];

      const withoutFull = current.filter((item) => item !== "full");
      if (withoutFull.length >= 2) {
        showToast("一次最多选两个部位，练得更专注");
        return current;
      }

      return [...withoutFull, id];
    });
  };

  const toggleEquipment = (id: EquipmentId) => {
    setSelectedEquipment((current) => {
      if (current.includes(id)) {
        if (current.length === 1) {
          showToast("至少保留一种可用器械");
          return current;
        }
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  };

  const createPlan = (nextSeed = Date.now()) => {
    const nextOptions = { ...options, seed: nextSeed };
    const nextPlan = generateWorkout(nextOptions);

    if (nextPlan.length === 0) {
      showToast("当前条件下动作不够，试试多选一种器械");
      return;
    }

    setSeed(nextSeed);
    setPlan(nextPlan);
    setExpandedId(null);
    writeLocal(
      "liannaar-preferences",
      JSON.stringify({
        muscles: selectedMuscles,
        equipment: selectedEquipment,
        duration,
        level,
      }),
    );
    moveTo("plan");
  };

  const swapExercise = (index: number) => {
    const nextPlan = replaceExercise(plan, index, {
      ...options,
      seed: `${seed}:manual-swap`,
    });
    const changed =
      nextPlan[index]?.exercise.id !== plan[index]?.exercise.id;

    setPlan(nextPlan);
    showToast(changed ? "已换成同条件下的新动作" : "这个位置暂时没有其他合适动作");
  };

  const startWorkout = () => {
    setCurrentIndex(0);
    setCurrentSet(1);
    setRestSeconds(0);
    moveTo("workout");
  };

  const completeWorkout = () => {
    const session: WorkoutSession = {
      id: makeId("session"),
      date: new Date().toISOString(),
      muscles: selectedMuscles,
      duration,
      exerciseIds: plan.map((item) => item.exercise.id),
      exerciseNames: plan.map((item) => item.exercise.nameZh),
      sets: totalSets,
      effort: null,
    };
    const nextHistory = [session, ...history].slice(0, 60);

    const stored = writeLocal("liannaar-history", JSON.stringify(nextHistory));
    setHistory(nextHistory);
    setCurrentSessionId(session.id);
    setRestSeconds(0);
    moveTo("done");
    setSyncState(stored ? "synced" : "offline");
  };

  const completeSet = () => {
    if (!currentItem) return;

    if (
      currentSet >= currentItem.sets &&
      currentIndex >= plan.length - 1
    ) {
      completeWorkout();
      return;
    }

    setRestSeconds(currentItem.restSeconds);

    if (currentSet < currentItem.sets) {
      setCurrentSet((value) => value + 1);
    } else {
      setCurrentIndex((value) => value + 1);
      setCurrentSet(1);
    }
  };

  const installApp = async () => {
    if (!installPrompt) {
      showToast("打开浏览器菜单，选择“添加到主屏幕”");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      showToast("练哪儿已添加到桌面");
    }
  };

  const sharePlan = async () => {
    const text = `我在「练哪儿」抽到了一套 ${selectedMuscleNames} ${duration} 分钟训练：${plan
      .map((item) => item.exercise.nameZh)
      .join("、")}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "我的练哪儿训练", text });
      } else {
        await navigator.clipboard.writeText(text);
        showToast("训练方案已复制");
      }
    } catch {
      // Closing the native share sheet should not show an error.
    }
  };

  const saveFavorite = () => {
    if (plan.length === 0) return;
    if (isCurrentPlanSaved) {
      showToast("这套已经收藏过了");
      return;
    }

    const favorite: FavoritePlan = {
      id: makeId("favorite"),
      name: `${selectedMuscleNames} · ${duration}分钟`,
      muscles: selectedMuscles,
      duration,
      level,
      equipment: selectedEquipment,
      plan,
      createdAt: new Date().toISOString(),
    };
    const nextFavorites = [favorite, ...favorites].slice(0, 20);
    setFavorites(nextFavorites);
    const stored = writeLocal(
      "liannaar-favorites",
      JSON.stringify(nextFavorites),
    );
    showToast("已收藏，下次可以一键再练");
    setSyncState(stored ? "synced" : "offline");
  };

  const repeatFavorite = (favorite: FavoritePlan) => {
    setSelectedMuscles(favorite.muscles);
    setSelectedEquipment(favorite.equipment);
    setDuration(favorite.duration);
    setLevel(favorite.level);
    setSeed((current) => current + 1);
    setPlan(favorite.plan);
    setExpandedId(null);
    moveTo("plan");
  };

  const deleteFavorite = (favoriteId: string) => {
    const nextFavorites = favorites.filter(
      (favorite) => favorite.id !== favoriteId,
    );
    setFavorites(nextFavorites);
    const stored = writeLocal(
      "liannaar-favorites",
      JSON.stringify(nextFavorites),
    );
    setSyncState(stored ? "synced" : "offline");
  };

  const rateEffort = (effort: number) => {
    if (!currentSessionId) return;

    const nextHistory = history.map((session) =>
      session.id === currentSessionId ? { ...session, effort } : session,
    );
    setHistory(nextHistory);
    const stored = writeLocal("liannaar-history", JSON.stringify(nextHistory));
    showToast("体感记下了");
    setSyncState(stored ? "synced" : "offline");
  };

  if (screen === "workout" && currentItem) {
    const exercise = currentItem.exercise;
    const exerciseDemo = getExerciseDemo(exercise.id);
    const progress = ((currentIndex + 1) / plan.length) * 100;

    return (
      <main className="workout-shell">
        <header className="workout-topbar">
          <button
            className="workout-exit"
            type="button"
            onClick={() => moveTo("plan")}
            aria-label="返回训练方案"
          >
            ←
          </button>
          <div className="workout-progress-wrap">
            <div className="workout-progress-copy">
              <span>
                动作 {currentIndex + 1}/{plan.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="workout-progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button
            className="workout-more"
            type="button"
            onClick={() => showToast("完成当前训练后会自动保存记录")}
            aria-label="训练提示"
          >
            ···
          </button>
        </header>

        <section className="workout-stage">
          <div
            className={exerciseDemo ? "motion-card has-demo" : "motion-card"}
            data-muscle={exercise.muscles[0]}
            aria-label={`${exercise.nameZh} 动作示意`}
          >
            {exerciseDemo ? (
              <>
                <Image
                  className="motion-demo"
                  src={exerciseDemo.src}
                  alt={exerciseDemo.alt}
                  width={480}
                  height={480}
                  sizes="(max-width: 720px) 92vw, 520px"
                  unoptimized
                  priority
                />
                <span className="demo-live-badge">AI 辅助原创 · 循环</span>
              </>
            ) : (
              <>
                <div className="motion-orbit motion-orbit-one" />
                <div className="motion-orbit motion-orbit-two" />
                <div className="motion-figure">
                  <span className="motion-head" />
                  <span className="motion-body" />
                  <span className="motion-arm motion-arm-left" />
                  <span className="motion-arm motion-arm-right" />
                  <span className="motion-leg motion-leg-left" />
                  <span className="motion-leg motion-leg-right" />
                </div>
                <span className="motion-caption">动作节奏示意</span>
              </>
            )}
          </div>

          {exerciseDemo && (
            <p className="workout-form-cue">
              <span>{exerciseDemo.view}</span>
              {exerciseDemo.cue}
            </p>
          )}

          <div className="workout-title-row">
            <div>
              <span className="eyebrow dark-eyebrow">
                {ROLE_LABELS[currentItem.role]} · {equipmentLabel(exercise.equipment)}
              </span>
              <h1>{exercise.nameZh}</h1>
              <p>{exercise.nameEn}</p>
            </div>
            <span className="source-badge">#{exercise.sourceId}</span>
          </div>

          <div className="set-prescription">
            <div>
              <span>当前组</span>
              <strong>
                {currentSet}
                <small>/{currentItem.sets}</small>
              </strong>
            </div>
            <div>
              <span>目标</span>
              <strong className="rep-value">{currentItem.reps}</strong>
            </div>
            <div>
              <span>组间休息</span>
              <strong>
                {currentItem.restSeconds}
                <small>秒</small>
              </strong>
            </div>
          </div>

          <div className="set-dots" aria-label="组数进度">
            {Array.from({ length: currentItem.sets }, (_, index) => (
              <span
                className={index < currentSet - 1 ? "done" : index === currentSet - 1 ? "active" : ""}
                key={index}
              />
            ))}
          </div>

          <details className="coaching-card">
            <summary>动作要领</summary>
            <ol>
              {exercise.instructions.map((instruction, index) => (
                <li key={instruction}>
                  <span>{index + 1}</span>
                  <p>{instruction}</p>
                </li>
              ))}
            </ol>
          </details>
        </section>

        <div className="workout-actions">
          <button
            className="text-action light-action"
            type="button"
            onClick={() => swapExercise(currentIndex)}
          >
            换一个动作
          </button>
          <button className="complete-set-button" type="button" onClick={completeSet}>
            <span>完成这一组</span>
            <strong>✓</strong>
          </button>
        </div>

        {restSeconds > 0 && (
          <div className="rest-overlay" role="dialog" aria-modal="true">
            <div className="rest-card">
              <span className="eyebrow">BREATHE & RESET</span>
              <p>休息一下</p>
              <strong>{restSeconds}</strong>
              <span className="rest-unit">秒</span>
              <div className="breath-ring" />
              <button type="button" onClick={() => setRestSeconds(0)}>
                跳过休息 →
              </button>
            </div>
          </div>
        )}
        {toast && <div className="toast dark-toast">{toast}</div>}
      </main>
    );
  }

  return (
    <main className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="brand-bar">
        <button className="brand" type="button" onClick={() => moveTo("muscle")}>
          <span className="brand-mark">练</span>
          <span>
            <strong>练哪儿</strong>
            <small>LIÀN NǍR</small>
          </span>
        </button>
        <div className="header-actions">
          <button
            className="demo-button"
            type="button"
            onClick={() => moveTo("demos")}
            aria-current={screen === "demos" ? "page" : undefined}
          >
            <span>动作动画</span>
            <span className="demo-count">{EXERCISE_DEMOS.length}</span>
          </button>
          <button
            className="history-button"
            type="button"
            onClick={() => moveTo("insights")}
            aria-current={screen === "insights" ? "page" : undefined}
          >
            <span>训练记录</span>
            <span className="history-count">{history.length}</span>
          </button>
          <button className="install-button" type="button" onClick={installApp}>
            <span>添加到桌面</span>
            <strong>↘</strong>
          </button>
        </div>
      </header>

      {screen !== "insights" && screen !== "demos" && (
        <nav className="stepper" aria-label="训练生成步骤">
          {["练哪儿", "怎么练", "开始练"].map((label, index) => {
            const number = index + 1;
            return (
              <div
                className={SCREEN_STEP[screen] >= number ? "step active" : "step"}
                key={label}
              >
                <span>{String(number).padStart(2, "0")}</span>
                <p>{label}</p>
              </div>
            );
          })}
        </nav>
      )}

      {screen === "muscle" && (
        <section className="screen muscle-screen">
          <div className="hero-copy">
            <span className="eyebrow">YOUR BODY · YOUR SESSION</span>
            <h1>
              今天，
              <br />
              想练<span>哪儿？</span>
            </h1>
            <p>点一个部位，给你配好今天这一练。</p>
          </div>

          {latestSession && (
            <button
              className="last-session-banner"
              type="button"
              onClick={() => moveTo("insights")}
            >
              <span>
                上次训练 · {formatRelativeDate(latestSession.date)}
              </span>
              <strong>
                {latestSession.muscles.map(muscleLabel).join(" · ")}
              </strong>
              <small>查看记录 →</small>
            </button>
          )}

          <div className="muscle-grid">
            {MUSCLES.map((muscle, index) => {
              const selected = selectedMuscles.includes(muscle.id);
              const muscleProgress = coverage[muscle.id];
              return (
                <button
                  className={selected ? "muscle-card selected" : "muscle-card"}
                  data-muscle={muscle.id}
                  key={muscle.id}
                  type="button"
                  onClick={() => toggleMuscle(muscle.id)}
                  aria-pressed={selected}
                >
                  <span className="card-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="muscle-glyph">{muscle.glyph}</span>
                  <span className="muscle-name">
                    <strong>{muscle.label}</strong>
                    <small>{muscle.en}</small>
                  </span>
                  <span className="muscle-note">{muscle.note}</span>
                  <span className="muscle-frequency">
                    {muscleProgress.count > 0
                      ? `本周 ${muscleProgress.count} 次`
                      : muscleProgress.lastTrainedAt
                        ? `${formatRelativeDate(muscleProgress.lastTrainedAt)}练过`
                        : "本周未练"}
                  </span>
                  <span className="select-check">{selected ? "✓" : "+"}</span>
                </button>
              );
            })}
          </div>

          <div className="selection-bar">
            <div>
              <span>今日目标</span>
              <strong>
                {selectedMuscles.length > 0
                  ? selectedMuscleNames
                  : "选择 1–2 个部位"}
              </strong>
            </div>
            <button
              type="button"
              disabled={selectedMuscles.length === 0}
              onClick={() => moveTo("setup")}
            >
              下一步 <span>→</span>
            </button>
          </div>
        </section>
      )}

      {screen === "insights" && (
        <section className="screen insights-screen">
          <button className="back-link" type="button" onClick={() => moveTo("muscle")}>
            ← 回去选部位
          </button>

          <div className="insights-heading">
            <div>
              <span className="eyebrow">YOUR TRAINING RHYTHM</span>
              <h1>这一周，练到哪儿了？</h1>
              <p>记录不是为了打卡，是为了下一次练得更聪明。</p>
            </div>
            <span className={`sync-badge ${syncState}`}>
              {syncLabel[syncState]}
            </span>
          </div>

          <div className="insights-stats">
            <div className="insights-stat">
              <span>近 7 天</span>
              <strong>{week.sessions}</strong>
              <small>次训练</small>
            </div>
            <div className="insights-stat">
              <span>累计时间</span>
              <strong>{week.minutes}</strong>
              <small>分钟</small>
            </div>
            <div className="insights-stat">
              <span>完成训练量</span>
              <strong>{week.sets}</strong>
              <small>组</small>
            </div>
          </div>

          <section className="weekly-panel">
            <div>
              <span className="panel-kicker">WEEKLY PULSE</span>
              <h2>最近 7 天</h2>
            </div>
            <div className="weekly-chart" aria-label="最近七天训练分钟数">
              {week.days.map((day) => (
                <div className="day-column" key={day.date}>
                  <span>{day.minutes > 0 ? `${day.minutes}′` : ""}</span>
                  <div className="day-bar">
                    <i
                      className="day-fill"
                      style={{
                        height: `${day.minutes > 0
                          ? Math.max(12, (day.minutes / maxDayMinutes) * 100)
                          : 4}%`,
                      }}
                    />
                  </div>
                  <small className="day-label">{day.label}</small>
                </div>
              ))}
            </div>
          </section>

          <div className="insights-split">
            <section className="coverage-panel">
              <span className="panel-kicker">MUSCLE COVERAGE</span>
              <h2>本周覆盖</h2>
              <div className="coverage-grid">
                {MUSCLES.filter((muscle) => muscle.id !== "full").map(
                  (muscle) => {
                    const progress = coverage[muscle.id];
                    return (
                      <div
                        className="coverage-card"
                        data-muscle={muscle.id}
                        key={muscle.id}
                      >
                        <span className="coverage-dot" />
                        <div className="coverage-copy">
                          <strong>{muscle.label}</strong>
                          <small>{muscle.en}</small>
                        </div>
                        <span className="coverage-meta">
                          {progress.count > 0
                            ? `${progress.count} 次`
                            : progress.lastTrainedAt
                              ? formatRelativeDate(progress.lastTrainedAt)
                              : "还没练"}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </section>

            <section className="favorites-panel">
              <span className="panel-kicker">SAVED SESSIONS</span>
              <h2>收藏的训练</h2>
              {favorites.length > 0 ? (
                <div className="favorites-list">
                  {favorites.map((favorite) => (
                    <article className="favorite-card" key={favorite.id}>
                      <div className="favorite-card-head">
                        <div>
                          <strong>{favorite.name}</strong>
                          <span>
                            {favorite.plan.length} 个动作 ·{" "}
                            {levelLabel(favorite.level)}
                          </span>
                        </div>
                        <small>{formatRelativeDate(favorite.createdAt)}</small>
                      </div>
                      <div className="favorite-actions">
                        <button
                          type="button"
                          onClick={() => repeatFavorite(favorite)}
                        >
                          再练一次 →
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFavorite(favorite.id)}
                          aria-label={`删除 ${favorite.name}`}
                        >
                          删除
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span>☆</span>
                  <p>遇到喜欢的训练方案，点“收藏”留在这里。</p>
                </div>
              )}
            </section>
          </div>

          <section className="recent-panel">
            <span className="panel-kicker">RECENT SESSIONS</span>
            <h2>最近完成</h2>
            {history.length > 0 ? (
              <div className="session-list">
                {history.slice(0, 8).map((session) => (
                  <article className="session-card" key={session.id}>
                    <span className="session-date">
                      {formatRelativeDate(session.date)}
                    </span>
                    <div className="session-main">
                      <strong>
                        {session.muscles.map(muscleLabel).join(" · ") ||
                          "一套训练"}
                      </strong>
                      <p>
                        {session.exerciseNames.length > 0
                          ? session.exerciseNames.slice(0, 4).join("、")
                          : "旧版训练记录"}
                      </p>
                      <div className="session-tags">
                        <span>{session.duration} 分钟</span>
                        <span>{session.sets} 组</span>
                      </div>
                    </div>
                    <div
                      className="effort-dots"
                      aria-label={
                        session.effort
                          ? `训练体感 ${session.effort} 分`
                          : "未记录训练体感"
                      }
                    >
                      {Array.from({ length: 5 }, (_, index) => (
                        <i
                          className={
                            session.effort && index < session.effort
                              ? "active"
                              : ""
                          }
                          key={index}
                        />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span>↗</span>
                <p>完成第一套训练后，这里会开始长出你的训练节奏。</p>
              </div>
            )}
          </section>
        </section>
      )}

      {screen === "demos" && (
        <section className="screen demos-screen">
          <button
            className="back-link"
            type="button"
            onClick={() => moveTo("muscle")}
          >
            ← 回去选部位
          </button>

          <div className="demos-heading">
            <div>
              <span className="eyebrow">ORIGINAL MOTION STUDIES</span>
              <h1>先看动作，再开练。</h1>
              <p>
                {EXERCISE_DEMOS.length} 个 AI 辅助原创循环示范，先看清关节轨迹和起止位置。
              </p>
            </div>
            <span className="demo-note">
              {EXERCISE_DEMOS.length} 个动作 · 约 2.4 秒循环
            </span>
          </div>

          <div className="demo-grid">
            {EXERCISE_DEMOS.map((demo, index) => (
              <article className="demo-card" key={demo.id}>
                <div className="demo-media">
                  <Image
                    className="motion-demo"
                    src={demo.src}
                    alt={demo.alt}
                    width={480}
                    height={480}
                    sizes="(max-width: 720px) 92vw, (max-width: 1100px) 46vw, 520px"
                    unoptimized
                  />
                  <span className="demo-live-badge">LOOP · AI 辅助原创</span>
                </div>
                <span className="demo-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="demo-card-copy">
                  <h2>{demo.nameZh}</h2>
                  <small>{demo.view}</small>
                  <p>{demo.nameEn}</p>
                  <p className="demo-note">{demo.cue}</p>
                </div>
              </article>
            ))}
          </div>

          <p className="demo-disclaimer">
            动画用于理解关节轨迹与动作节奏，不替代教练或医疗建议。请按自身活动度调整幅度和负重；出现疼痛或不适应立即停止。
          </p>
        </section>
      )}

      {screen === "setup" && (
        <section className="screen setup-screen">
          <button className="back-link" type="button" onClick={() => moveTo("muscle")}>
            ← 重新选部位
          </button>
          <div className="section-heading">
            <span className="eyebrow">SET YOUR SESSION</span>
            <h1>今天怎么练？</h1>
            <p>
              目标是 <strong>{selectedMuscleNames}</strong>，再告诉我你手边有什么。
            </p>
          </div>

          <div className="setup-block">
            <div className="block-heading">
              <span>01</span>
              <div>
                <h2>可用器械</h2>
                <p>可以多选</p>
              </div>
            </div>
            <div className="equipment-grid">
              {EQUIPMENT.map((item) => {
                const selected = selectedEquipment.includes(item.id);
                return (
                  <button
                    className={selected ? "equipment-chip selected" : "equipment-chip"}
                    key={item.id}
                    type="button"
                    onClick={() => toggleEquipment(item.id)}
                    aria-pressed={selected}
                  >
                    <span>{selected ? "✓" : "+"}</span>
                    <strong>{item.label}</strong>
                    <small>{item.short}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="setup-row">
            <div className="setup-block compact-block">
              <div className="block-heading">
                <span>02</span>
                <div>
                  <h2>练多久</h2>
                  <p>包含组间休息</p>
                </div>
              </div>
              <div className="duration-picker">
                {DURATIONS.map((value) => (
                  <button
                    className={duration === value ? "selected" : ""}
                    key={value}
                    type="button"
                    onClick={() => setDuration(value)}
                  >
                    <strong>{value}</strong>
                    <small>分钟</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-block compact-block">
              <div className="block-heading">
                <span>03</span>
                <div>
                  <h2>今天的状态</h2>
                  <p>按体感选择</p>
                </div>
              </div>
              <div className="level-picker">
                {(["beginner", "intermediate"] as Level[]).map((value) => (
                  <button
                    className={level === value ? "selected" : ""}
                    key={value}
                    type="button"
                    onClick={() => setLevel(value)}
                  >
                    <span>{value === "beginner" ? "○" : "●"}</span>
                    <strong>{levelLabel(value)}</strong>
                    <small>
                      {value === "beginner" ? "动作稳一点" : "强度高一点"}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="generator-note">
            <span className="note-mark">✦</span>
            <div>
              <strong>不是瞎随机</strong>
              <p>会自动安排热身、主力、辅助和收尾，尽量避开重复动作模式。</p>
            </div>
          </div>

          <button className="primary-cta" type="button" onClick={() => createPlan()}>
            <span>
              <small>GENERATE MY SESSION</small>
              给我抽一套
            </span>
            <strong>→</strong>
          </button>
        </section>
      )}

      {screen === "plan" && (
        <section className="screen plan-screen">
          <button className="back-link" type="button" onClick={() => moveTo("setup")}>
            ← 修改训练条件
          </button>
          <div className="plan-heading">
            <div>
              <span className="eyebrow">TODAY&apos;S SESSION</span>
              <h1>今天就这么练。</h1>
              <p>{selectedMuscleNames} · {levelLabel(level)}</p>
            </div>
            <div className="plan-heading-actions">
              <button
                className="favorite-button"
                type="button"
                onClick={saveFavorite}
              >
                {isCurrentPlanSaved ? "★ 已收藏" : "☆ 收藏"}
              </button>
              <button className="share-button" type="button" onClick={sharePlan}>
                分享 ↗
              </button>
            </div>
          </div>

          <div className="session-ticket">
            <div>
              <span>预计时间</span>
              <strong>{duration}<small> MIN</small></strong>
            </div>
            <div>
              <span>动作数量</span>
              <strong>{plan.length}<small> MOVES</small></strong>
            </div>
            <div>
              <span>训练总组</span>
              <strong>{totalSets}<small> SETS</small></strong>
            </div>
            <div className="ticket-code">LN/{String(seed).slice(-5)}</div>
          </div>

          <div className="plan-list">
            {plan.map((item, index) => {
              const exercise = item.exercise;
              const exerciseDemo = getExerciseDemo(exercise.id);
              const expanded = expandedId === exercise.id;
              return (
                <article className="exercise-card" key={`${exercise.id}-${index}`}>
                  <div className="exercise-main">
                    <span className="exercise-order">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div
                      className={
                        exerciseDemo
                          ? "exercise-symbol has-demo"
                          : "exercise-symbol"
                      }
                      data-muscle={exercise.muscles[0]}
                    >
                      {exerciseDemo ? (
                        <Image
                          className="exercise-symbol-demo"
                          src={exerciseDemo.src}
                          alt={`${exercise.nameZh} 动作动画缩略图`}
                          width={160}
                          height={120}
                          sizes="80px"
                          unoptimized
                        />
                      ) : (
                        <span>
                          {muscleLabel(exercise.muscles[0]).slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="exercise-copy">
                      <span className="role-label">{ROLE_LABELS[item.role]}</span>
                      <h2>{exercise.nameZh}</h2>
                      <p>
                        {equipmentLabel(exercise.equipment)} · {exercise.movement}
                      </p>
                    </div>
                    <div className="exercise-dose">
                      <strong>{item.sets}</strong>
                      <span>组</span>
                      <p>{item.reps}</p>
                    </div>
                  </div>

                  <div className="exercise-actions">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : exercise.id)}
                    >
                      {expanded ? "收起要领" : "查看要领"}
                    </button>
                    <button type="button" onClick={() => swapExercise(index)}>
                      换一个 ↻
                    </button>
                  </div>

                  {expanded && (
                    <ol className="instruction-list">
                      {exercise.instructions.map((instruction, stepIndex) => (
                        <li key={instruction}>
                          <span>{stepIndex + 1}</span>
                          <p>{instruction}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              );
            })}
          </div>

          <div className="plan-controls">
            <button
              className="secondary-cta"
              type="button"
              onClick={() => createPlan(Date.now())}
            >
              🎲 再抽一套
            </button>
            <button className="start-cta" type="button" onClick={startWorkout}>
              开始训练 <span>→</span>
            </button>
          </div>

          <p className="safety-note">
            按自身状态选择负重。出现疼痛或不适请立即停止；本工具不替代专业医疗或训练建议。
          </p>
        </section>
      )}

      {screen === "done" && (
        <section className="screen done-screen">
          <div className="done-burst">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} style={{ "--i": index } as React.CSSProperties} />
            ))}
            <div className="done-check">✓</div>
          </div>
          <span className="eyebrow">SESSION COMPLETE</span>
          <h1>今天这儿，练到了。</h1>
          <p>{selectedMuscleNames} · {duration} 分钟</p>

          <div className="done-stats">
            <div>
              <strong>{plan.length}</strong>
              <span>个动作</span>
            </div>
            <div>
              <strong>{totalSets}</strong>
              <span>训练组</span>
            </div>
            <div>
              <strong>{history.length}</strong>
              <span>累计完成</span>
            </div>
          </div>

          <div className="effort-prompt">
            <div>
              <span className="panel-kicker">QUICK CHECK-IN</span>
              <strong>今天这套，体感怎么样？</strong>
            </div>
            <div className="effort-options">
              {[
                { value: 2, label: "轻松" },
                { value: 3, label: "刚好" },
                { value: 4, label: "吃力" },
              ].map((item) => (
                <button
                  className={currentEffort === item.value ? "selected" : ""}
                  type="button"
                  key={item.value}
                  onClick={() => rateEffort(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="done-message">
            <span>✦</span>
            <p>
              {syncState === "synced"
                ? "训练记录已同步。下次生成时，也会尽量少重复最近练过的动作。"
                : "训练记录已先保存在本机；网络恢复后会继续同步。"}
            </p>
          </div>

          <div className="done-actions">
            <button
              className="primary-cta"
              type="button"
              onClick={() => {
                setSelectedMuscles([]);
                moveTo("muscle");
              }}
            >
              <span>
                <small>PLAN ANOTHER SESSION</small>
                再练个别的
              </span>
              <strong>→</strong>
            </button>
            <button
              className="done-repeat"
              type="button"
              onClick={() => moveTo("insights")}
            >
              看看我的训练记录
            </button>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <p>
          <strong>练哪儿</strong> · 选个部位，马上开练。
        </p>
        <span>
          精选 48 个动作 · {EXERCISE_DEMOS.length} 个 AI 辅助原创动作动画 · 数据源
          exercises-dataset
        </span>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
