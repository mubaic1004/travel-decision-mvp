import type { Metadata } from "next";

import { WorkoutApp } from "@/components/workout/workout-app";

export const metadata: Metadata = {
  title: "练哪儿 — chenmubai.cn",
  description:
    "选想练的肌群、手边有的器械和能给的时间，它生成一套有结构的训练，并记下你这周练了多少。",
};

export default function WorkoutPage() {
  return <WorkoutApp />;
}
