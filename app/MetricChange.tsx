export function MetricChange({ value, period, light = false, empty = false }: { value: number; period: string; light?: boolean; empty?: boolean }) {
  const amount = Number.isFinite(value) ? value : 0;
  const direction = empty || amount === 0 ? "neutral" : amount > 0 ? "positive" : "negative";
  const label = empty ? "尚待累積" : amount === 0 ? "持平" : `${Math.abs(amount)}%`;
  return <div className={`metric-change is-${direction} ${light ? "light" : ""}`}>
    <i className={`bi ${direction === "neutral" ? "bi-dash" : direction === "positive" ? "bi-arrow-up-right" : "bi-arrow-down-right"}`} aria-hidden="true" />
    <strong>{label}</strong><span>{empty ? "有新紀錄後更新" : `${period}${amount === 0 ? "" : amount > 0 ? "增加" : "減少"}`}</span>
  </div>;
}
