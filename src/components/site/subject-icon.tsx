import { BookOpenText, BrainCircuit, FlaskConical, Globe2, Laptop, Puzzle, Sigma, type LucideProps } from "lucide-react";

const ICONS = {
  english: BookOpenText,
  maths: Sigma,
  science: FlaskConical,
  gk: Globe2,
  reasoning: Puzzle,
  computer: Laptop,
  ai: BrainCircuit,
} as const;

export function SubjectIcon({ icon, ...props }: { icon: string } & LucideProps) {
  const Icon = ICONS[icon as keyof typeof ICONS] ?? BookOpenText;
  return <Icon aria-hidden {...props} />;
}
