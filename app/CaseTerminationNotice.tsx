import type { TerminationNotice } from "../lib/report";

function formatTermination(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[4]);
  const period = hour < 12 ? "上午" : "下午";
  const displayHour = hour % 12 || 12;

  return {
    date: `民國${Number(match[1]) - 1911}年${match[2]}月${match[3]}日`,
    time: `${period}${displayHour}:${match[5]}`,
  };
}

export function CaseTerminationNotice({ notice }: { notice: TerminationNotice }) {
  if (!notice.enabled) return null;

  const formatted = formatTermination(notice.terminatedAt);
  const label = formatted
    ? `此案已於${formatted.date} ${formatted.time} 解約`
    : "此案已解約";

  return (
    <p className="case-termination-notice" role="status" aria-label={label}>
      <span>此案已於</span>
      {formatted && <strong>{formatted.date}</strong>}
      <span>{formatted ? `${formatted.time} 解約` : "已解約"}</span>
    </p>
  );
}
