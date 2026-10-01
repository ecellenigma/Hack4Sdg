export const SDG_COLORS: Record<number, string> = {
  1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D", 5: "#FF3A21",
  6: "#26BDE2", 7: "#FCC30B", 8: "#A21942", 9: "#FD6925", 10: "#DD1367",
  11: "#FD9D24", 12: "#BF8B2E", 13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B",
  16: "#00689D", 17: "#19486A", 18: "#151515",
};

export const SDG_NAMES: Record<number, string> = {
  1: "No Poverty", 2: "Zero Hunger", 3: "Good Health & Well-being",
  4: "Quality Education", 5: "Gender Equality", 6: "Clean Water & Sanitation",
  7: "Affordable & Clean Energy", 8: "Decent Work & Economic Growth",
  9: "Industry, Innovation & Infrastructure", 10: "Reduced Inequalities",
  11: "Sustainable Cities & Communities", 12: "Responsible Consumption & Production",
  13: "Climate Action", 14: "Life Below Water", 15: "Life on Land",
  16: "Peace, Justice & Strong Institutions", 17: "Partnerships for the Goals",
  18: "Student Innovation",
};

/** Readable text colour (dark or white) on top of an SDG colour. */
export function onColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0b0b0a" : "#ffffff";
}
