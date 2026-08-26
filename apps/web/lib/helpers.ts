export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
  }).format(date);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value}%`;
}

export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function truncate(text: string, length = 50): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export function generateComplianceScore(scores: number[]): number {
  if (!scores.length) return 0;

  const total = scores.reduce((sum, score) => sum + score, 0);

  return Math.round(total / scores.length);
}
