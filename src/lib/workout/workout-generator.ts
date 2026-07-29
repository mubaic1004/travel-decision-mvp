import {
  EXERCISES,
  type EquipmentId,
  type Exercise,
  type ExerciseRole,
  type Level,
  type MuscleId,
} from "./exercise-data";

export type WorkoutDuration = 15 | 30 | 45 | 60;

export type WorkoutOptions = {
  muscles: readonly MuscleId[];
  equipment: readonly EquipmentId[];
  duration: WorkoutDuration;
  level: Level;
  /**
   * Exercise IDs used in recent workouts. Matching exercises remain eligible,
   * but are strongly deprioritized so small candidate pools can still be used.
   */
  avoidExerciseIds?: readonly string[];
  /**
   * Pass a different seed to draw another plan with the same filters.
   * When omitted, the filters themselves form a stable default seed.
   */
  seed?: number | string;
};

export type WorkoutPlanItem = {
  exercise: Exercise;
  role: ExerciseRole;
  sets: number;
  reps: string;
  restSeconds: number;
};

type Random = () => number;

type SelectionState = {
  usedIds: Set<string>;
  usedMovements: Set<string>;
  coveredMuscles: Set<MuscleId>;
  avoidedIds: ReadonlySet<string>;
};

const TARGET_COUNT: Record<WorkoutDuration, number> = {
  15: 4,
  30: 5,
  45: 6,
  60: 7,
};

const TRAINABLE_MUSCLES: readonly MuscleId[] = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "core",
  "legs",
  "glutes",
];

const ROLE_FALLBACKS: Record<ExerciseRole, readonly ExerciseRole[]> = {
  warmup: ["warmup", "accessory", "finisher", "main"],
  main: ["main", "accessory", "finisher", "warmup"],
  accessory: ["accessory", "main", "finisher", "warmup"],
  finisher: ["finisher", "accessory", "main", "warmup"],
};

const RECENT_EXERCISE_PENALTY = 1_000;

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function hash(value: string): number {
  let result = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }

  return result >>> 0;
}

function createRandom(seed: number): Random {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function optionsSeed(options: WorkoutOptions, suffix = ""): number {
  const muscles = unique(options.muscles).sort().join(",");
  const equipment = unique(options.equipment).sort().join(",");
  const avoidedIds = unique(options.avoidExerciseIds ?? []).sort().join(",");
  const avoidedSeed = avoidedIds ? `|avoid:${avoidedIds}` : "";
  const suppliedSeed = options.seed ?? "default";

  return hash(
    `${String(suppliedSeed)}|${muscles}|${equipment}|${options.duration}|${options.level}${avoidedSeed}|${suffix}`,
  );
}

function rolesForCount(count: number): ExerciseRole[] {
  if (count <= 0) return [];
  if (count === 1) return ["main"];
  if (count === 2) return ["main", "finisher"];
  if (count === 3) return ["main", "accessory", "finisher"];

  return [
    "warmup",
    "main",
    ...Array.from({ length: count - 3 }, () => "accessory" as const),
    "finisher",
  ];
}

function effectiveTargets(muscles: readonly MuscleId[]): {
  targets: MuscleId[];
  fullBody: boolean;
} {
  const selected = unique(muscles);
  const fullBody = selected.includes("full");
  const explicitTargets = selected.filter(
    (muscle): muscle is Exclude<MuscleId, "full"> => muscle !== "full",
  );

  if (fullBody) {
    return { targets: [...TRAINABLE_MUSCLES], fullBody: true };
  }

  return { targets: explicitTargets, fullBody: false };
}

function isAllowedForLevel(exercise: Exercise, level: Level): boolean {
  if (level === "beginner") return exercise.level === "beginner";

  // Intermediate users can safely use beginner movements when an exact-level
  // candidate is unavailable.
  return exercise.level === "intermediate" || exercise.level === "beginner";
}

function matchesTarget(
  exercise: Exercise,
  targets: readonly MuscleId[],
  fullBody: boolean,
): boolean {
  if (fullBody) {
    return exercise.muscles.some(
      (muscle) => muscle === "full" || targets.includes(muscle),
    );
  }

  return exercise.muscles.includes("full") ||
    exercise.muscles.some((muscle) => targets.includes(muscle));
}

function buildPool(options: WorkoutOptions): {
  pool: Exercise[];
  targets: MuscleId[];
  fullBody: boolean;
} {
  const allowedEquipment = new Set(unique(options.equipment));
  const { targets, fullBody } = effectiveTargets(options.muscles);

  if (allowedEquipment.size === 0 || targets.length === 0) {
    return { pool: [], targets, fullBody };
  }

  const pool = EXERCISES.filter(
    (exercise) =>
      allowedEquipment.has(exercise.equipment) &&
      isAllowedForLevel(exercise, options.level) &&
      matchesTarget(exercise, targets, fullBody),
  );

  return { pool, targets, fullBody };
}

function uncoveredCount(
  exercise: Exercise,
  targets: readonly MuscleId[],
  covered: ReadonlySet<MuscleId>,
): number {
  if (exercise.muscles.includes("full")) {
    return covered.has("full") ? 0 : 1;
  }

  return exercise.muscles.filter(
    (muscle) => targets.includes(muscle) && !covered.has(muscle),
  ).length;
}

function scoreCandidate(
  exercise: Exercise,
  preferredRole: ExerciseRole,
  targets: readonly MuscleId[],
  fullBody: boolean,
  state: SelectionState,
  level: Level,
  random: Random,
): number {
  const roleRank = ROLE_FALLBACKS[preferredRole].indexOf(exercise.role);
  let score = roleRank === -1 ? 0 : (4 - roleRank) * 100;

  if (exercise.level === level) score += 18;
  if (!state.usedMovements.has(exercise.movement)) score += 55;
  if (state.avoidedIds.has(exercise.id)) {
    score -= RECENT_EXERCISE_PENALTY;
  }

  const newCoverage = uncoveredCount(
    exercise,
    targets,
    state.coveredMuscles,
  );
  score += newCoverage * (fullBody ? 80 : 24);

  const selectedCoverage = exercise.muscles.filter(
    (muscle) => muscle === "full" || targets.includes(muscle),
  ).length;
  score += selectedCoverage * 12;

  // Jitter only breaks similarly scored candidates; plan structure still wins.
  return score + random() * 20;
}

function pickExercise(
  pool: readonly Exercise[],
  preferredRole: ExerciseRole,
  targets: readonly MuscleId[],
  fullBody: boolean,
  state: SelectionState,
  level: Level,
  random: Random,
): Exercise | undefined {
  const available = pool.filter(
    (exercise) => !state.usedIds.has(exercise.id),
  );

  if (available.length === 0) return undefined;

  const roleOrder = ROLE_FALLBACKS[preferredRole];
  let candidates: Exercise[] = [];

  // Avoid a repeated movement first. Relax that constraint only if necessary
  // to reach the requested workout length.
  for (const role of roleOrder) {
    candidates = available.filter(
      (exercise) =>
        exercise.role === role &&
        !state.usedMovements.has(exercise.movement),
    );
    if (candidates.length > 0) break;
  }

  if (candidates.length === 0) {
    for (const role of roleOrder) {
      candidates = available.filter((exercise) => exercise.role === role);
      if (candidates.length > 0) break;
    }
  }

  if (candidates.length === 0) candidates = available;

  return candidates
    .map((exercise) => ({
      exercise,
      score: scoreCandidate(
        exercise,
        preferredRole,
        targets,
        fullBody,
        state,
        level,
        random,
      ),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.exercise.id.localeCompare(right.exercise.id),
    )[0]?.exercise;
}

function addCoverage(
  coveredMuscles: Set<MuscleId>,
  exercise: Exercise,
  targets: readonly MuscleId[],
): void {
  if (exercise.muscles.includes("full")) {
    coveredMuscles.add("full");
    return;
  }

  exercise.muscles.forEach((muscle) => {
    if (targets.includes(muscle)) coveredMuscles.add(muscle);
  });
}

function toPlanItem(
  exercise: Exercise,
  plannedRole: ExerciseRole,
): WorkoutPlanItem {
  return {
    exercise,
    role: plannedRole,
    sets: exercise.sets,
    reps: exercise.reps,
    restSeconds: exercise.rest,
  };
}

export function generateWorkout(
  options: WorkoutOptions,
): WorkoutPlanItem[] {
  const { pool, targets, fullBody } = buildPool(options);
  if (pool.length === 0) return [];

  const random = createRandom(optionsSeed(options, "generate"));
  const targetCount = TARGET_COUNT[options.duration];
  const roles = rolesForCount(targetCount);
  const state: SelectionState = {
    usedIds: new Set<string>(),
    usedMovements: new Set<string>(),
    coveredMuscles: new Set<MuscleId>(),
    avoidedIds: new Set(options.avoidExerciseIds ?? []),
  };

  const plan: WorkoutPlanItem[] = [];

  for (const role of roles) {
    const exercise = pickExercise(
      pool,
      role,
      targets,
      fullBody,
      state,
      options.level,
      random,
    );

    if (!exercise) break;

    state.usedIds.add(exercise.id);
    state.usedMovements.add(exercise.movement);
    addCoverage(state.coveredMuscles, exercise, targets);
    plan.push(toPlanItem(exercise, role));
  }

  return plan;
}

export function replaceExercise(
  plan: readonly WorkoutPlanItem[],
  index: number,
  options: WorkoutOptions,
): WorkoutPlanItem[] {
  const nextPlan = plan.slice();
  const current = plan[index];

  if (!current || !Number.isInteger(index)) return nextPlan;

  const { pool, targets, fullBody } = buildPool(options);
  const otherItems = plan.filter((_, itemIndex) => itemIndex !== index);
  const state: SelectionState = {
    usedIds: new Set(otherItems.map((item) => item.exercise.id)),
    usedMovements: new Set(
      otherItems.map((item) => item.exercise.movement),
    ),
    coveredMuscles: new Set<MuscleId>(),
    avoidedIds: new Set(options.avoidExerciseIds ?? []),
  };

  otherItems.forEach((item) => {
    addCoverage(state.coveredMuscles, item.exercise, targets);
  });

  // Excluding the current exercise ensures the button actually changes the
  // movement when another valid candidate exists.
  state.usedIds.add(current.exercise.id);

  const random = createRandom(
    optionsSeed(
      options,
      `replace:${index}:${plan.map((item) => item.exercise.id).join(",")}`,
    ),
  );
  const replacement = pickExercise(
    pool,
    current.role,
    targets,
    fullBody,
    state,
    options.level,
    random,
  );

  if (!replacement) return nextPlan;

  nextPlan[index] = toPlanItem(replacement, current.role);
  return nextPlan;
}
