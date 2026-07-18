const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatCurrency(value: number): string {
  return `₹${inr.format(value)}`;
}

export function formatCurrencyRange(min: number, max: number): string {
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}
