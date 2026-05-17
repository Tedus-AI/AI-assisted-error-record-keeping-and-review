export function calculateNextMasteryLevel(
  currentLevel: number,
  isCorrect: boolean
): number {
  if (isCorrect) return Math.min(5, currentLevel + 1);
  return Math.max(0, currentLevel - 1);
}

export function masteryLabel(level: number) {
  if (level <= 0) return "未掌握";
  if (level === 1) return "待加強";
  if (level === 2) return "基礎理解";
  if (level === 3) return "基本掌握";
  if (level === 4) return "穩定";
  return "精通";
}

export function masteryTone(level: number) {
  if (level <= 1) return "text-crayon-red bg-red-50 border-crayon-red";
  if (level <= 2) return "text-crayon-orange bg-orange-50 border-crayon-orange";
  if (level <= 3) return "text-crayon-purple bg-purple-50 border-crayon-purple";
  return "text-crayon-green bg-green-50 border-crayon-green";
}
