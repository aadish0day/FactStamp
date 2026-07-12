export function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\u0900-\u097F\u0041-\u007A\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
