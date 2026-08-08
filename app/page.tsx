import Link from "next/link";
import type { Metadata } from "next";
import { getReport } from "../lib/report-store";
import { defaultReport, parseComparableCases } from "../lib/report";
import { RefreshTime } from "./RefreshTime";
import { RollingNumber } from "./RollingNumber";
import { ProspectiveBuyers } from "./ProspectiveBuyers";
import { WeeklyViewingDetails } from "./WeeklyViewingDetails";
import { AnnouncementModal } from "./AnnouncementModal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "房屋銷售進度報告",
  description: "即時掌握賞屋、市場行情與曝光成效。",
};

const number = new Intl.NumberFormat("zh-TW");

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
  const comparables = parseComparableCases(report.comparableCases);
  return (
    <main className="site-shell">
      <AnnouncementModal announcement={report.announcement} />
      <header className="topbar">
        <Link href="/" className="mini-title" aria-label="屋況首頁">
          <strong>時上S</strong>
          <span>屋主銷售進度</span>
        </Link>
        <RefreshTime />
      </header>

      <section className="summary-grid" id="overview" aria-label="本期摘要">
        <article className="metric-card featured">
          <div className="metric-heading">
            <MetricIcon>人</MetricIcon>
            <div><span>賞屋人數</span><small>本週與累積統計</small></div>
          </div>
          <div className="viewing-split">
            <WeeklyViewingDetails times={report.viewingThisWeekTimes} groups={report.viewingThisWeek} />
            <div className="viewing-stat"><span>總賞屋人數</span><div><strong><RollingNumber value={report.viewingCount} /></strong><small>組</small></div></div>
          </div>
          <div className="metric-change up">↑ {report.viewingGrowth}% <span>較上期成長</span></div>
          <ProspectiveBuyers buyers={report.prospectiveBuyers} />
        </article>

        <a
          className="metric-card dark-card listing-card-link"
          href="https://591.to/S814S"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="前往 591 查看時上S刊登頁面"
        >
          <div className="metric-heading">
            <MetricIcon tone="ink">591</MetricIcon>
            <div><span>591 瀏覽次數</span><small className="listing-rates">平日 800元/天　假日 1800元/天</small></div>
            <i className="bi bi-arrow-up-right listing-link-icon" aria-hidden="true" />
          </div>
          <div className="metric-value"><strong><RollingNumber value={report.view591Count} duration={1100} /></strong><span>次</span></div>
          <div className="metric-change light">↑ {report.view591Growth}% <span>近七日</span></div>
          <div className="device-breakdown" aria-label={`電腦 ${report.view591Desktop} 次，手機 ${report.view591Mobile} 次`}>
            <div><i className="bi bi-laptop" aria-hidden="true" /><span>電腦</span><strong>{report.view591Desktop}</strong></div>
            <div><i className="bi bi-phone" aria-hidden="true" /><span>手機</span><strong>{report.view591Mobile}</strong></div>
          </div>
          <div className="sync-row"><span>最後同步</span><time>{report.last591Sync}</time></div>
        </a>
      </section>

      <section className="market-section" id="market">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MARKET SNAPSHOT</p>
            <h2>周遭行情</h2>
          </div>
          <p>{report.marketSummary}</p>
        </div>

        <div className="market-grid">
          <article className="price-card">
            <div className="price-topline"><span>目前開價</span></div>
            <div className="listing-price"><strong>{number.format(report.listingPrice)}</strong><span>萬元</span></div>
            <div className="price-scale">
              <div className="scale-track"><i style={{ left: `${Math.min(92, Math.max(8, ((report.listingPrice - report.marketLow) / (report.marketHigh - report.marketLow)) * 100))}%` }} /></div>
              <div className="scale-labels"><span>{report.marketLow} 萬</span><span>區域中位 {report.marketMedian} 萬</span><span>{report.marketHigh} 萬</span></div>
            </div>
            <div className="price-facts">
              <div><span>物件單價</span><strong>{report.averagePingPrice}<small> 萬／坪</small></strong></div>
              <div><span>上週成交</span><strong>{report.recentTransactions}<small> 筆</small></strong></div>
            </div>
          </article>

          <article className="comparable-card">
            <div className="table-title"><h3>近期相似成交</h3><span>實價登錄參考</span></div>
            <div className="comparable-list">
              {comparables.map((item, index) => (
                <div className="comparable-row" key={`${item.name}-${index}`}>
                  <div className="case-dot">{index + 1}</div>
                  <div className="case-main"><strong>{item.name}</strong><span>{item.detail}</span></div>
                  <div className="case-price"><strong>{item.price}</strong><span>{item.unit}</span></div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="analysis-section" id="analysis">
        <div className="analysis-label">
          <span className="portrait-placeholder">{report.agentName.slice(0, 1)}</span>
          <div><strong>{report.agentName}</strong><small>{report.agentTitle}</small></div>
        </div>
        <div className="analysis-copy">
          <p className="eyebrow">AGENT INSIGHT</p>
          <h2>專員個人分析</h2>
          <blockquote>「{report.analysisHeadline}」</blockquote>
          <p>{report.analysisBody}</p>
          <div className="recommendation"><span>本期建議</span><p>{report.recommendation}</p></div>
        </div>
      </section>

      <footer>
        <p className="footer-note">© 2026 即將成立永慶不動產．All rights reserved.</p>
        <p className="footer-thanks">感謝全體股東參與測試並提供寶貴回饋，讓我們持續完善網站功能，打造更優質的使用體驗。</p>
      </footer>

      <nav className="mini-tabbar" aria-label="頁面導覽">
        <a href="#overview"><i className="bi bi-grid-1x2-fill" aria-hidden="true" />概況</a>
        <a href="#market"><i className="bi bi-graph-up-arrow" aria-hidden="true" />行情</a>
        <a href="#analysis"><i className="bi bi-clipboard-data" aria-hidden="true" />分析</a>
        <a href="https://line.me/ti/p/ng4Rg_uhNN"><i className="bi bi-line" aria-hidden="true" />聯絡</a>
      </nav>
    </main>
  );
}
