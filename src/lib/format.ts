/**
 * Indian-rupee formatting shared by every view. Rounds to whole rupees and
 * uses en-IN digit grouping (₹8,830 — not ₹8.830 or ₹8830).
 */
export function formatINR(n: number): string {
  const rounded = Math.round(n);
  return "₹" + rounded.toLocaleString("en-IN");
}
