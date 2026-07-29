import {
  type EquipmentId,
  type Level,
  type MuscleId,
} from "./exercise-data";
import {
  type WorkoutDuration,
  type WorkoutPlanItem,
} from "./workout-generator";

export type WorkoutSession = {
  id: string;
  date: string;
  muscles: MuscleId[];
  duration: number;
  exerciseIds: string[];
  exerciseNames: string[];
  sets: number;
  /** Perceived effort from 1 (easy) to 5 (very hard). */
  effort: number | null;
};

export type FavoritePlan = {
  id: string;
  name: string;
  muscles: MuscleId[];
  duration: WorkoutDuration;
  level: Level;
  equipment: EquipmentId[];
  plan: WorkoutPlanItem[];
  createdAt: string;
};

export type WeeklyDayBucket = {
  date: string;
  label: string;
  sessions: number;
  minutes: number;
  sets: number;
};

export type WeeklySummary = {
  sessions: number;
  minutes: number;
  sets: number;
  days: WeeklyDayBucket[];
};

export type MuscleCoverageEntry = {
  count: number;
  lastTrainedAt: string | null;
};

export type MuscleCoverage = Record<MuscleId, MuscleCoverageEntry>;

type UnknownRecord = Record<string, unknown>;
type DateInput = Date | string | number;

const MUSCLE_IDS: readonly MuscleId[] = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "core",
  "legs",
  "glutes",
  "full",
];

const MUSCLE_ID_SET = new Set<string>(MUSCLE_IDS);
const DAY_IN_MS = 86_400_000;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredInput(input: unknown): unknown {
  if (typeof input !== "string") return input;

  try {
    return JSON.parse(input) as unknown;
  } catch {
    return [];
  }
}

function sessionArray(input: unknown): unknown[] {
  const parsed = parseStoredInput(input);
  if (Array.isArray(parsed)) return parsed;

  // Also tolerate a future storage envelope such as { sessions: [...] }.
  if (isRecord(parsed) && Array.isArray(parsed.sessions)) {
    return parsed.sessions;
  }

  return [];
}

function validDate(value: unknown): Date | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    !(value instanceof Date)
  ) {
    return null;
  }

  const parsed = value instanceof Date
    ? new Date(value.getTime())
    : new Date(value);

  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function referenceDate(now?: DateInput): Date {
  const parsed = validDate(now);
  return parsed ?? new Date();
}

function nonNegativeInteger(value: unknown): number {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    value === ""
  ) {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed);
}

function normalizeEffort(value: unknown): number | null {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5
    ? parsed
    : null;
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const strings = value
    .filter(
      (item): item is string | number =>
        typeof item === "string" || typeof item === "number",
    )
    .map((item) => String(item).trim())
    .filter(Boolean);

  return [...new Set(strings)];
}

function normalizeMuscles(value: unknown): MuscleId[] {
  const values = Array.isArray(value) ? value : [value];
  const muscles = values.filter(
    (item): item is MuscleId =>
      typeof item === "string" && MUSCLE_ID_SET.has(item),
  );

  return [...new Set(muscles)];
}

function exerciseRecords(value: unknown): UnknownRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

function idsFromExerciseRecords(value: unknown): string[] {
  const ids = exerciseRecords(value)
    .map((exercise) => exercise.id)
    .filter(
      (id): id is string | number =>
        typeof id === "string" || typeof id === "number",
    );

  return uniqueStrings(ids);
}

function namesFromExerciseRecords(value: unknown): string[] {
  const names = exerciseRecords(value)
    .map((exercise) => exercise.nameZh ?? exercise.name)
    .filter(
      (name): name is string | number =>
        typeof name === "string" || typeof name === "number",
    );

  return uniqueStrings(names);
}

/**
 * Converts persisted data into the current session shape.
 *
 * V1 records only contained id/date/muscles/duration/exercises/sets. Missing
 * exercise detail and effort fields are intentionally normalized to []/null.
 * Malformed entries and invalid dates are ignored instead of breaking stats.
 */
export function normalizeSessions(input: unknown): WorkoutSession[] {
  return sessionArray(input).flatMap((value, index) => {
    if (!isRecord(value)) return [];

    const date = validDate(value.date ?? value.completedAt);
    if (!date) return [];

    const isoDate = date.toISOString();
    const rawId = value.id;
    const id =
      (typeof rawId === "string" || typeof rawId === "number") &&
      String(rawId).trim()
        ? String(rawId)
        : `session-${index}-${isoDate}`;

    const exerciseIds = uniqueStrings(value.exerciseIds);
    const exerciseNames = uniqueStrings(value.exerciseNames);

    return [{
      id,
      date: isoDate,
      muscles: normalizeMuscles(value.muscles),
      duration: nonNegativeInteger(value.duration),
      exerciseIds:
        exerciseIds.length > 0
          ? exerciseIds
          : idsFromExerciseRecords(value.exercises),
      exerciseNames:
        exerciseNames.length > 0
          ? exerciseNames
          : namesFromExerciseRecords(value.exercises),
      sets: nonNegativeInteger(value.sets),
      effort: normalizeEffort(value.effort),
    }];
  });
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function localDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sevenDayWindow(now?: DateInput): {
  reference: Date;
  start: Date;
} {
  const reference = referenceDate(now);
  const today = startOfLocalDay(reference);
  return {
    reference,
    start: addLocalDays(today, -6),
  };
}

export function weeklySummary(
  sessions: unknown,
  now?: DateInput,
): WeeklySummary {
  const normalized = normalizeSessions(sessions);
  const { reference, start } = sevenDayWindow(now);
  const days = Array.from({ length: 7 }, (_, index): WeeklyDayBucket => {
    const day = addLocalDays(start, index);
    return {
      date: localDateKey(day),
      label: formatRelativeDate(day, reference),
      sessions: 0,
      minutes: 0,
      sets: 0,
    };
  });
  const buckets = new Map(days.map((day) => [day.date, day]));
  const startTime = start.getTime();
  const nowTime = reference.getTime();

  for (const session of normalized) {
    const date = validDate(session.date);
    if (!date) continue;

    const timestamp = date.getTime();
    if (timestamp < startTime || timestamp > nowTime) continue;

    const bucket = buckets.get(localDateKey(date));
    if (!bucket) continue;

    bucket.sessions += 1;
    bucket.minutes += session.duration;
    bucket.sets += session.sets;
  }

  return {
    sessions: days.reduce((total, day) => total + day.sessions, 0),
    minutes: days.reduce((total, day) => total + day.minutes, 0),
    sets: days.reduce((total, day) => total + day.sets, 0),
    days,
  };
}

export function muscleCoverage(
  sessions: unknown,
  now?: DateInput,
): MuscleCoverage {
  const normalized = normalizeSessions(sessions);
  const { reference, start } = sevenDayWindow(now);
  const startTime = start.getTime();
  const nowTime = reference.getTime();
  const coverage = Object.fromEntries(
    MUSCLE_IDS.map((muscle) => [
      muscle,
      { count: 0, lastTrainedAt: null },
    ]),
  ) as MuscleCoverage;

  for (const session of normalized) {
    const date = validDate(session.date);
    if (!date || date.getTime() > nowTime) continue;

    const timestamp = date.getTime();
    for (const muscle of session.muscles) {
      const entry = coverage[muscle];
      if (timestamp >= startTime) entry.count += 1;

      const previous = validDate(entry.lastTrainedAt);
      if (!previous || timestamp > previous.getTime()) {
        entry.lastTrainedAt = session.date;
      }
    }
  }

  return coverage;
}

export function recentExerciseIds(
  sessions: unknown,
  limitSessions = 3,
): string[] {
  if (!Number.isFinite(limitSessions) || limitSessions <= 0) return [];

  const limit = Math.floor(limitSessions);
  const recentSessions = normalizeSessions(sessions)
    .map((session, index) => ({ session, index }))
    .sort(
      (left, right) =>
        new Date(right.session.date).getTime() -
          new Date(left.session.date).getTime() ||
        left.index - right.index,
    )
    .slice(0, limit);

  const ids: string[] = [];
  const seen = new Set<string>();

  for (const { session } of recentSessions) {
    for (const id of session.exerciseIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }

  return ids;
}

function localCalendarNumber(date: Date): number {
  return Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ) / DAY_IN_MS;
}

export function formatRelativeDate(
  value: DateInput,
  now?: DateInput,
): string {
  const date = validDate(value);
  if (!date) return "未知日期";

  const reference = referenceDate(now);
  const difference =
    localCalendarNumber(date) - localCalendarNumber(reference);

  if (difference === 0) return "今天";
  if (difference === -1) return "昨天";
  if (difference === 1) return "明天";
  if (difference < 0 && difference >= -6) {
    return `${Math.abs(difference)}天前`;
  }
  if (difference > 0 && difference <= 6) {
    return `${difference}天后`;
  }

  const monthAndDay = `${date.getMonth() + 1}月${date.getDate()}日`;
  return date.getFullYear() === reference.getFullYear()
    ? monthAndDay
    : `${date.getFullYear()}年${monthAndDay}`;
}
