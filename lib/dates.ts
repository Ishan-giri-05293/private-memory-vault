// Dates are stored as typed (e.g. "2024-03-15" or "March 2024"), so only ISO ones get reformatted.
export function prettyDate(date: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function dateToSortValue(date: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const t = new Date(date).getTime();
    return isNaN(t) ? Number.POSITIVE_INFINITY : t;
  }
  return Number.POSITIVE_INFINITY;
}
