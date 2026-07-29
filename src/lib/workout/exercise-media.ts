import armsCoreMetadata from "./manifests/arms-core.json";
import baseMetadata from "./manifests/base.json";
import lowerFullMetadata from "./manifests/lower-full.json";
import shoulderMetadata from "./manifests/shoulders.json";
import upperMetadata from "./manifests/upper.json";
import { EXERCISES } from "./exercise-data";

export type ExerciseDemo = {
  id: string;
  src: string;
  nameZh: string;
  nameEn: string;
  view: string;
  cue: string;
  alt: string;
};

type DemoMetadata = Pick<ExerciseDemo, "id" | "view" | "cue" | "alt">;

const DEMO_METADATA = [
  ...baseMetadata,
  ...upperMetadata,
  ...shoulderMetadata,
  ...armsCoreMetadata,
  ...lowerFullMetadata,
] satisfies DemoMetadata[];

const metadataById = new Map(
  DEMO_METADATA.map((metadata) => [metadata.id, metadata]),
);

if (metadataById.size !== DEMO_METADATA.length) {
  throw new Error("Exercise demo metadata contains duplicate exercise ids.");
}

if (metadataById.size !== EXERCISES.length) {
  throw new Error("Exercise demo metadata must cover the complete catalogue.");
}

const titleCase = (value: string) =>
  value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

const DEMO_ASSET_VERSION_BY_ID: Readonly<
  Partial<Record<string, string>>
> = {
  "barbell-glute-bridge": "v5",
  "cable-seated-rear-lateral-raise": "v4",
};

export const EXERCISE_DEMOS: ExerciseDemo[] = EXERCISES.map((exercise) => {
  const metadata = metadataById.get(exercise.id);

  if (!metadata) {
    throw new Error(`Missing exercise demo metadata for ${exercise.id}.`);
  }

  const assetVersion = DEMO_ASSET_VERSION_BY_ID[exercise.id] ?? "v3";

  return {
    ...metadata,
    src: `/exercises/${exercise.id}-${assetVersion}.gif`,
    nameZh: exercise.nameZh,
    nameEn: titleCase(exercise.nameEn),
  };
});

export const EXERCISE_DEMO_BY_ID: Readonly<Record<string, ExerciseDemo>> =
  Object.fromEntries(EXERCISE_DEMOS.map((demo) => [demo.id, demo]));

export const getExerciseDemo = (exerciseId: string) =>
  EXERCISE_DEMO_BY_ID[exerciseId];
