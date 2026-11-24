export function getPublicImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (/^\/(?![/\\])/.test(value) && !value.includes("\\")) return value;
  return getHttpsUrl(value);
}

export function getHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || !/^https:\/\//i.test(value) || !URL.canParse(value)) return null;
  const url = new URL(value);
  return !url.username && !url.password ? url.href : null;
}
