import { format, formatDistance } from "date-fns";

const REFERENCE_NOW = new Date("2026-07-12T12:00:00Z");

export function timeAgo(isoString) {
  if (!isoString) return "—";
  const then = new Date(isoString);
  if (isNaN(then)) return "—";
  return formatDistance(then, REFERENCE_NOW, { addSuffix: true });
}

export function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d)) return "—";
  return format(d, "MMMM yyyy");
}

export function formatMemberSince(isoString) {
  return formatDate(isoString);
}
