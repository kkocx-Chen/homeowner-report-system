import type { ConveyancingProcess } from "../lib/report";

const conveyancingSteps: Array<{ id: ConveyancingProcess["currentStep"]; label: string }> = [
  { id: "offer", label: "收斡旋" },
  { id: "meeting", label: "見面談" },
  { id: "contract", label: "簽約" },
  { id: "seal", label: "用印" },
  { id: "tax", label: "完稅" },
  { id: "transfer", label: "過戶" },
  { id: "handover", label: "交屋" },
];

function displayDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "日期待確認";
  return `${Number(match[2])}/${Number(match[3])}`;
}

export function ConveyancingProgress({ process }: { process: ConveyancingProcess }) {
  if (!process.enabled) return null;

  const currentStep = conveyancingSteps.find((step) => step.id === process.currentStep) ?? conveyancingSteps[0];

  return (
    <article className="metric-card conveyancing-card" aria-labelledby="conveyancing-title">
      <div className="conveyancing-heading">
        <span className="conveyancing-icon" aria-hidden="true"><i className="bi bi-file-earmark-check-fill" /></span>
        <div>
          <h2 id="conveyancing-title">代書流程</h2>
          <p>簽約、過戶與交屋進度</p>
        </div>
        <span className="conveyancing-state"><i aria-hidden="true" />進行中</span>
      </div>

      <div className="conveyancing-current">
        <div>
          <span>目前最新進度</span>
          <strong>{currentStep.label}</strong>
        </div>
        <time dateTime={process.scheduledDate}>{displayDate(process.scheduledDate)}</time>
      </div>
    </article>
  );
}
