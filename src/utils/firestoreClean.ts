export function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedDeep(item)) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  const cleaned: Record<string, unknown> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    if (item === undefined) return;
    cleaned[key] = removeUndefinedDeep(item);
  });

  return cleaned as T;
}
