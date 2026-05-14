import type { Metadata } from "next";

import { TravelMvp } from "@/components/travel-mvp";

export const metadata: Metadata = {
  title: "旅行规划助手 — chenmubai.cn",
  description:
    "告诉它你想什么时候出发、能请几天假，它会算出最省钱、最省假、最划算三个方案。",
};

export default function TravelPage() {
  return <TravelMvp />;
}
