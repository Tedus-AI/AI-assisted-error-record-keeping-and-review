export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
