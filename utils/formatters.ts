export const formatPercent = (value: number) => new Intl.NumberFormat("en-NG", { style: "percent", maximumFractionDigits: 0 }).format(value);
