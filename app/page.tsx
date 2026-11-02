import Link from "next/link";
import type { Metadata } from "next";
import { getReport } from "../lib/report-store";
import { defaultReport } from "../lib/report";
import { RefreshTime } from "./RefreshTime";
import { RollingNumber } from "./RollingNumber";
import { ProspectiveBuyers } from "./ProspectiveBuyers";
import { TotalViewingDetails, WeeklyViewingDetails } from "./WeeklyViewingDetails";
import { AnnouncementCenter } from "./AnnouncementModal";
import { NegotiationCenter } from "./NegotiationCenter";
import { ConveyancingProgress } from "./ConveyancingProgress";
import { CaseTerminationNotice } from "./CaseTerminationNotice";
import { SectionNavigation } from "./SectionNavigation";
import { MetricChange } from "./MetricChange";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "房屋銷售進度報告",
  description: "即時掌握賞屋、曝光成效與專員分析。",
};

function MetricIcon({ children, tone = "clay" }: { children: React.ReactNode; tone?: "clay" | "ink" }) {
  return <span className={`metric-icon ${tone}`} aria-hidden="true">{children}</span>;
}

export default async function Home() {
  let report = defaultReport;
  try {
    report = await getReport();
  } catch {
    // The polished sample remains visible while a local database is starting.
  }
  const updatedDate = new Date(report.updatedAt);
  const updatedLabel = Number.isNaN(updatedDate.getTime()) ? "待更新" : new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(updatedDate);
  return (
    <main className="site-shell">
      <a className="skip-link" href="#overview">跳至銷售概況</a>
      <header className="topbar">
        <Link href="/" className="mini-title" aria-label="屋況首頁">
          <strong>{report.propertyName}</strong>
          <span>屋主銷售進度</span>
        </Link>
        <div className="topbar-actions">
          <NegotiationCenter records={report.negotiationRecords} />
          <AnnouncementCenter enabled={report.announcementEnabled} announcements={report.announcements} />
        </div>
      </header>

      <div className="report-freshness">
        <span>資料更新 <time dateTime={report.updatedAt}>{updatedLabel}</time></span>
        <RefreshTime />
      </div>
      <section className="summary-grid" id="overview" aria-label="本期摘要">
        {!report.terminationNotice.enabled && <ConveyancingProgress process={report.conveyancingProcess} />}
        <article className="metric-card featured">
          <div className="metric-heading viewing-card-heading">
            <MetricIcon><i className="bi bi-people-fill" /></MetricIcon>
            <div><h2>賞屋人數</h2><small>每一次帶看，掌握最新回饋</small></div>
            <CaseTerminationNotice notice={report.terminationNotice} />
          </div>
          <div className="viewing-split">
            <WeeklyViewingDetails times={report.viewingThisWeekTimes} groups={report.viewingThisWeek} />
            <TotalViewingDetails times={report.viewingTimes} groups={report.viewingCount} />
          </div>
          <MetricChange value={report.viewingGrowth} period="較上期" empty={report.viewingCount === 0 && report.viewingThisWeek === 0} />
          <ProspectiveBuyers buyers={report.prospectiveBuyers} />
        </article>

        <a
          className="metric-card dark-card listing-card-link"
          href="https://sale.591.com.tw/home/house/detail/2/20915071.html"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`查看 ${report.propertyName} 的 591 刊登頁面（另開分頁）`}
        >
          <div className="metric-heading">
            <MetricIcon tone="ink">591</MetricIcon>
            <div><h2>591 瀏覽次數</h2><small className="listing-rates">平日 800元/天 · 假日 1800元/天</small></div>
            <i className="bi bi-arrow-up-right listing-link-icon" aria-hidden="true" />
          </div>
          <div className="metric-value"><strong><RollingNumber value={report.view591Count} duration={1100} /></strong><span>次</span></div>
          <MetricChange value={report.view591Growth} period="近七日" light empty={report.view591Count === 0} />
          <div className="device-breakdown" aria-label={`電腦 ${report.view591Desktop} 次，手機 ${report.view591Mobile} 次`}>
            <div><i className="bi bi-laptop" aria-hidden="true" /><span>電腦</span><strong>{report.view591Desktop}</strong></div>
            <div><i className="bi bi-phone" aria-hidden="true" /><span>手機</span><strong>{report.view591Mobile}</strong></div>
          </div>
          <div className="sync-row"><span>最後同步</span><time>{report.last591Sync}</time></div>
        </a>
      </section>

      <section className="analysis-section" id="analysis">
        <div className="analysis-label">
          <span className="portrait-placeholder">{report.agentName.slice(0, 1)}</span>
          <div><strong>{report.agentName}</strong><small>{report.agentTitle}</small></div>
        </div>
        <div className="analysis-copy">
          <p className="eyebrow">觀察與下一步</p>
          <h2>專員個人分析</h2>
          {report.analysisHeadline.trim() && <blockquote>「{report.analysisHeadline}」</blockquote>}
          <p>{report.analysisBody.trim() || "專員整理回饋後，將在這裡提供最新分析。"}</p>
          {report.recommendation.trim() && <div className="recommendation"><span>本期建議</span><p>{report.recommendation}</p></div>}
        </div>
      </section>

      <footer>
        <p className="footer-note">© 2026 即將成立永慶不動產．All rights reserved.</p>
        <p className="footer-thanks">感謝全體股東參與測試並提供寶貴回饋，讓我們持續完善網站功能，打造更優質的使用體驗。</p>
      </footer>

      <SectionNavigation />
    </main>
  );
}
