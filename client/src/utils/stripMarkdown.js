/**
 * Strip markdown characters from text for clean excerpts (no ##, **, etc.).
 * Truncate to maxLength and append ellipsis if needed.
 */
export function stripMarkdown(text, maxLength = 160) {
  if (!text || typeof text !== "string") return "";
  let out = text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/\n+/g, " ")
    .trim();
  if (out.length > maxLength) out = out.slice(0, maxLength).trim() + "...";
  return out;
}
