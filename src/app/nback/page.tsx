import { NBackTrainer } from "@/components/nback/nback-trainer";

export const metadata = {
  title: "N-Back Brain Trainer",
  description: "一个轻量的工作记忆训练小游戏。",
};

export default function NBackPage() {
  return <NBackTrainer />;
}
