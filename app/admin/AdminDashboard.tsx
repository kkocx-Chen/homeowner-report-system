"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { defaultReport, type NegotiationRecord, type PropertyReport, type ProspectiveBuyer } from "../../lib/report";

type AnnouncementDraft = {
  title: string;
  body: string;
  imageUrl: string;
};

const emptyAnnouncementDraft: AnnouncementDraft = { title: "", body: "", imageUrl: "" };

function newRecordId() {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `announcement-${Date.now()}`;
}

function formatAnnouncementTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "發布時間未設定";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

type NumericKey = {
  [K in keyof PropertyReport]: PropertyReport[K] extends number ? K : never
}[keyof PropertyReport];

function Field({ label, hint, children, wide = false, className = "" }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean; className?: string }) {
  return <label className={`admin-field ${wide ? "wide" : ""} ${className}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function AdminDashboard({ initialAuthenticated, authDisabled }: { initialAuthenticated: boolean; authDisabled: boolean }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [report, setReport] = useState<PropertyReport>(defaultReport);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAnnouncementImage, setUploadingAnnouncementImage] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState<AnnouncementDraft>(emptyAnnouncementDraft);

  useEffect(() => {
    fetch("/api/report").then((response) => response.json()).then((data) => {
      if (data.report) setReport(data.report);
    }).finally(() => setLoading(false));
  }, []);

  const setText = (key: keyof PropertyReport, value: string) => setReport((current) => ({ ...current, [key]: value }));
  const setNumber = (key: NumericKey, value: string) => setReport((current) => ({ ...current, [key]: Number(value) }));
  const setViewingCount = (value: string) => setReport((current) => {
    const parsed = Number(value);
    const count = Number.isFinite(parsed) ? Math.max(0, Math.min(200, Math.round(parsed))) : 0;
    return { ...current, viewingCount: count };
  });
  const setViewingTime = (index: number, value: string) => setReport((current) => {
    const times = [...current.viewingTimes];
    times[index] = value;
    return { ...current, viewingTimes: times };
  });
  const addViewingTime = () => setReport((current) => ({
    ...current,
    viewingTimes: [...current.viewingTimes, ""],
  }));
  const removeViewingTime = (index: number) => setReport((current) => ({
    ...current,
    viewingTimes: current.viewingTimes.filter((_, timeIndex) => timeIndex !== index),
  }));
  const setViewingThisWeek = (value: string) => setReport((current) => {
    const parsed = Number(value);
    const count = Number.isFinite(parsed) ? Math.max(0, Math.min(50, Math.round(parsed))) : 0;
    return {
      ...current,
      viewingThisWeek: count,
      viewingThisWeekTimes: Array.from({ length: count }, (_, index) => current.viewingThisWeekTimes?.[index] ?? ""),
    };
  });
  const setViewingThisWeekTime = (index: number, value: string) => setReport((current) => {
    const times = Array.from({ length: current.viewingThisWeek }, (_, timeIndex) => current.viewingThisWeekTimes?.[timeIndex] ?? "");
    times[index] = value;
    return { ...current, viewingThisWeekTimes: times };
  });
  const set591Device = (key: "view591Desktop" | "view591Mobile", value: string) => setReport((current) => {
    const nextValue = Number(value);
    const otherValue = key === "view591Desktop" ? current.view591Mobile : current.view591Desktop;
    return { ...current, [key]: nextValue, view591Count: nextValue + otherValue };
  });
  const setConveyancingProcess = (patch: Partial<PropertyReport["conveyancingProcess"]>) => setReport((current) => ({
    ...current,
    conveyancingProcess: { ...current.conveyancingProcess, ...patch },
  }));
  const setTerminationNotice = (patch: Partial<PropertyReport["terminationNotice"]>) => setReport((current) => ({
    ...current,
    terminationNotice: { ...current.terminationNotice, ...patch },
    conveyancingProcess: patch.enabled === true
      ? { ...current.conveyancingProcess, enabled: false }
      : current.conveyancingProcess,
  }));
  const setAnnouncementDraftValue = (patch: Partial<AnnouncementDraft>) => setAnnouncementDraft((current) => ({ ...current, ...patch }));
  const updateAnnouncementVisibility = (id: string, enabled: boolean) => setReport((current) => ({
    ...current,
    announcements: current.announcements.map((announcement) => announcement.id === id ? { ...announcement, enabled } : announcement),
  }));
  const updateNegotiationRecord = (id: string, patch: Partial<NegotiationRecord>) => setReport((current) => ({
    ...current,
    negotiationRecords: current.negotiationRecords.map((record) => record.id === id ? { ...record, ...patch } : record),
  }));
  const addNegotiationRecord = () => setReport((current) => ({
    ...current,
    negotiationRecords: [...current.negotiationRecords, {
      id: newRecordId(),
      buyerLabel: `買方 ${current.negotiationRecords.length + 1}`,
      receivedAt: "",
      offerPrice: null,
      earnestMoney: null,
      status: "negotiating",
      note: "",
      createdAt: new Date().toISOString(),
    }],
  }));
  const removeNegotiationRecord = (id: string) => setReport((current) => ({
    ...current,
    negotiationRecords: current.negotiationRecords.filter((record) => record.id !== id),
  }));
  const updateProspectiveBuyer = (index: number, patch: Partial<ProspectiveBuyer>) => setReport((current) => ({
    ...current,
    prospectiveBuyers: current.prospectiveBuyers.map((buyer, buyerIndex) => buyerIndex === index ? { ...buyer, ...patch } : buyer),
  }));
  const addProspectiveBuyer = () => setReport((current) => ({
    ...current,
    prospectiveBuyers: [...current.prospectiveBuyers, { title: "", status: "tracking", reason: "", progress: "", revisitTime: "" }],
  }));
  const removeProspectiveBuyer = (index: number) => setReport((current) => ({
    ...current,
    prospectiveBuyers: current.prospectiveBuyers.filter((_, buyerIndex) => buyerIndex !== index),
  }));
  const moveProspectiveBuyer = (index: number, direction: -1 | 1) => setReport((current) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.prospectiveBuyers.length) return current;
    const prospectiveBuyers = [...current.prospectiveBuyers];
    [prospectiveBuyers[index], prospectiveBuyers[targetIndex]] = [prospectiveBuyers[targetIndex], prospectiveBuyers[index]];
    return { ...current, prospectiveBuyers };
  });

  async function login(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "登入失敗");
    setAuthenticated(true);
    setPassword("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const hasAnnouncementDraft = Boolean(announcementDraft.title.trim() || announcementDraft.body.trim() || announcementDraft.imageUrl);
    if (hasAnnouncementDraft && !announcementDraft.title.trim()) {
      setMessage("請先填寫公告標題，再儲存發布。");
      return;
    }

    setSaving(true);
    setMessage("");
    const nextReport: PropertyReport = hasAnnouncementDraft ? {
      ...report,
      announcementEnabled: true,
      announcements: [{
        id: newRecordId(),
        enabled: true,
        title: announcementDraft.title.trim(),
        body: announcementDraft.body.trim(),
        imageUrl: announcementDraft.imageUrl,
        publishedAt: new Date().toISOString(),
      }, ...report.announcements],
    } : report;
    const response = await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(nextReport) });
    const data = await response.json();
    if (response.ok) {
      setReport(data.report);
      if (hasAnnouncementDraft) setAnnouncementDraft(emptyAnnouncementDraft);
      setMessage(hasAnnouncementDraft ? "新公告已發布並加入歷史紀錄。" : "更新完成，屋主頁已顯示最新內容。");
    } else {
      setMessage(data.error || "更新失敗，請稍後再試。");
      if (response.status === 401) setAuthenticated(false);
    }
    setSaving(false);
  }

  async function uploadAnnouncementImage(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image) return;

    setUploadingAnnouncementImage(true);
    setMessage("");
    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch("/api/admin/announcement-image", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "公告照片上傳失敗，請稍後再試。");
        if (response.status === 401) setAuthenticated(false);
        return;
      }
      setAnnouncementDraftValue({ imageUrl: data.url });
      setMessage("公告照片上傳完成，請記得儲存所有變更。");
    } catch {
      setMessage("公告照片上傳失敗，請確認網路後再試。");
    } finally {
      setUploadingAnnouncementImage(false);
    }
  }

  async function logout() {
    if (authDisabled) return;
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthenticated(false);
  }

  if (!authenticated) {
    return <main className="admin-login-shell">
      <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">S</span><span>時上S</span></Link>
      <section className="login-card">
        <span className="login-symbol">編</span>
        <p className="eyebrow">ADMIN CONSOLE</p>
        <h1>管理員登入</h1>
        <p>登入後即可更新屋主看到的所有數據與專員分析。</p>
        <form onSubmit={login}>
          <label><span>管理密碼</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="請輸入管理密碼" autoComplete="current-password" required /></label>
          <button type="submit">登入管理後台</button>
        </form>
        {message && <div className="form-message error" role="alert">{message}</div>}
        <Link href="/" className="back-link">← 返回屋主報告</Link>
      </section>
    </main>;
  }

  return <main className="admin-shell">
    <header className="admin-topbar">
      <div><Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">S</span><span>時上S</span></Link><span className="admin-badge">管理後台</span></div>
      <div><Link href="/" className="preview-button">預覽屋主頁 ↗</Link>{authDisabled ? <span className="admin-badge">免登入調整中</span> : <button type="button" className="logout-button" onClick={logout}>登出</button>}</div>
    </header>

    <form className="admin-content" onSubmit={save}>
      <div className="admin-title"><div><p className="eyebrow">REPORT EDITOR</p><h1>更新房屋進度</h1><p>依區塊填寫，儲存後屋主頁會立即更新。</p></div><button className="save-button" type="submit" disabled={saving || loading || uploadingAnnouncementImage}>{saving ? "儲存中…" : uploadingAnnouncementImage ? "照片上傳中…" : "儲存所有變更"}</button></div>
      {message && <div className={`form-message ${message.includes("完成") ? "success" : "error"}`} role="status">{message}</div>}

      <section className="admin-panel">
        <div className="panel-heading"><span>01</span><div><h2>物件基本資料</h2><p>屋主頁最上方顯示的名稱與本期狀態</p></div></div>
        <div className="form-grid">
          <Field label="物件名稱"><input value={report.propertyName} onChange={(e) => setText("propertyName", e.target.value)} /></Field>
          <Field label="報告期間"><input value={report.reportPeriod} onChange={(e) => setText("reportPeriod", e.target.value)} /></Field>
          <Field label="地址／委託資訊" wide><input value={report.address} onChange={(e) => setText("address", e.target.value)} /></Field>
          <Field label="銷售狀態"><input value={report.saleStatus} onChange={(e) => setText("saleStatus", e.target.value)} /></Field>
          <Field label="狀態補充"><input value={report.statusNote} onChange={(e) => setText("statusNote", e.target.value)} /></Field>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading"><span>02</span><div><h2>案件狀態與代書流程</h2><p>顯示解約資訊，或更新簽約與過戶進度</p></div></div>
        <div className="form-grid">
          <button type="button" className={`announcement-toggle wide ${report.terminationNotice.enabled ? "is-enabled" : ""}`} role="switch" aria-checked={report.terminationNotice.enabled} onClick={() => setTerminationNotice({ enabled: !report.terminationNotice.enabled })}>
            <span className="announcement-toggle-control" aria-hidden="true"><i className="bi bi-check-lg" /></span>
            <span className="announcement-toggle-copy"><strong>顯示解約通知</strong><small>開啟後顯示在賞屋人數右側，並關閉代書流程卡片。</small></span>
          </button>
          <Field label="解約時間" wide><input type="datetime-local" value={report.terminationNotice.terminatedAt} onChange={(event) => setTerminationNotice({ terminatedAt: event.target.value })} disabled={!report.terminationNotice.enabled} /></Field>
          <button type="button" className={`announcement-toggle wide ${report.conveyancingProcess.enabled ? "is-enabled" : ""}`} role="switch" aria-checked={report.conveyancingProcess.enabled} onClick={() => setConveyancingProcess({ enabled: !report.conveyancingProcess.enabled })} disabled={report.terminationNotice.enabled}>
            <span className="announcement-toggle-control" aria-hidden="true"><i className="bi bi-check-lg" /></span>
            <span className="announcement-toggle-copy"><strong>顯示代書流程卡片</strong><small>{report.terminationNotice.enabled ? "解約通知開啟時，代書流程會自動關閉。" : "開啟時，卡片會顯示在賞屋人數上方。"}</small></span>
          </button>
          <Field label="目前最新流程">
            <select value={report.conveyancingProcess.currentStep} onChange={(event) => setConveyancingProcess({ currentStep: event.target.value as PropertyReport["conveyancingProcess"]["currentStep"] })} disabled={report.terminationNotice.enabled}>
              <option value="offer">收斡旋</option>
              <option value="meeting">見面談</option>
              <option value="contract">簽約</option>
              <option value="seal">用印</option>
              <option value="tax">完稅</option>
              <option value="transfer">過戶</option>
              <option value="handover">交屋</option>
            </select>
          </Field>
          <Field label="流程日期"><input type="date" value={report.conveyancingProcess.scheduledDate} onChange={(event) => setConveyancingProcess({ scheduledDate: event.target.value })} disabled={report.terminationNotice.enabled} /></Field>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading"><span>03</span><div><h2>賞屋人數</h2><p>更新本週與累積賞屋熱度</p></div></div>
        <div className="form-grid three">
          <Field label="本週賞屋組數"><input type="number" min="0" max="50" value={report.viewingThisWeek} onChange={(e) => setViewingThisWeek(e.target.value)} /></Field>
          <Field label="總賞屋組數"><input type="number" min="0" max="200" value={report.viewingCount} onChange={(e) => setViewingCount(e.target.value)} /></Field>
          <Field label="較上期成長 %"><input type="number" step="0.1" value={report.viewingGrowth} onChange={(e) => setNumber("viewingGrowth", e.target.value)} /></Field>
          <div className="weekly-viewing-admin">
            <div className="weekly-viewing-admin-heading">
              <strong>每組帶看時間</strong>
              <span>依本週賞屋組數自動產生 {report.viewingThisWeek} 個時間欄位</span>
            </div>
            <div className="weekly-viewing-admin-grid">
              {report.viewingThisWeek > 0 ? Array.from({ length: report.viewingThisWeek }, (_, index) => (
                <Field key={index} label={`第 ${index + 1} 組帶看時間`}>
                  <input type="datetime-local" value={report.viewingThisWeekTimes?.[index] ?? ""} onChange={(e) => setViewingThisWeekTime(index, e.target.value)} />
                </Field>
              )) : <p className="weekly-viewing-admin-empty">本週組數為 0，暫無帶看時間欄位。</p>}
            </div>
          </div>
          <div className="weekly-viewing-admin total-viewing-admin">
            <div className="weekly-viewing-admin-heading">
              <div><strong>總賞屋帶看時間</strong><span>只需新增手上有明確時間的紀錄，不必對應總賞屋組數</span></div>
              <button type="button" className="viewing-time-add-button" onClick={addViewingTime} disabled={report.viewingTimes.length >= 200}>
                <i className="bi bi-calendar2-plus" aria-hidden="true" />新增時間
              </button>
            </div>
            <div className="weekly-viewing-admin-grid">
              {report.viewingTimes.length > 0 ? report.viewingTimes.map((time, index) => (
                <div className="total-viewing-admin-row" key={index}>
                  <Field label={`第 ${index + 1} 筆帶看時間`}>
                    <input type="datetime-local" min="2026-08-13T00:00" value={time} onChange={(e) => setViewingTime(index, e.target.value)} />
                  </Field>
                  <button type="button" className="viewing-time-remove-button" onClick={() => removeViewingTime(index)} aria-label={`刪除第 ${index + 1} 筆帶看時間`}>
                    <i className="bi bi-trash3" aria-hidden="true" />
                  </button>
                </div>
              )) : <p className="weekly-viewing-admin-empty">尚未新增可查詢的帶看時間。</p>}
            </div>
          </div>
          <div className="buyer-admin-editor">
            <div className="buyer-admin-heading">
              <div><strong>有望買方</strong><span>可設定追蹤中，或填寫買方無效的原因</span></div>
              <button type="button" className="buyer-add-button" onClick={addProspectiveBuyer} disabled={report.prospectiveBuyers.length >= 20}>
                <i className="bi bi-person-plus" aria-hidden="true" />新增買方
              </button>
            </div>
            <div className="buyer-admin-list">
              {report.prospectiveBuyers.length > 0 ? report.prospectiveBuyers.map((buyer, index) => (
                <div className="buyer-admin-row" key={index}>
                  <Field label={`買方 ${index + 1} 標題`} className="buyer-title-field"><input value={buyer.title} onChange={(e) => updateProspectiveBuyer(index, { title: e.target.value })} placeholder="例如：二次看屋買方 A" /></Field>
                  <Field label="目前狀態" className="buyer-status-field">
                    <select
                      value={buyer.status}
                      onChange={(e) => {
                        const status = e.target.value as ProspectiveBuyer["status"];
                        updateProspectiveBuyer(index, { status, reason: status === "tracking" ? "" : buyer.reason });
                      }}
                    >
                      <option value="tracking">追蹤中</option>
                      <option value="invalid">已無效</option>
                    </select>
                  </Field>
                  <Field label="目前進度" className="buyer-progress-field">
                    <input value={buyer.progress ?? ""} onChange={(e) => updateProspectiveBuyer(index, { progress: e.target.value })} placeholder="例如：已完成首次帶看，持續討論貸款條件" />
                  </Field>
                  <Field label="複看時間" className="buyer-revisit-field">
                    <input value={buyer.revisitTime ?? ""} onChange={(e) => updateProspectiveBuyer(index, { revisitTime: e.target.value })} placeholder="例如：8 月 10 日 14:00" />
                  </Field>
                  <Field label="無效原因" className="buyer-reason-field">
                    <input
                      value={buyer.reason ?? ""}
                      onChange={(e) => updateProspectiveBuyer(index, { reason: e.target.value })}
                      placeholder={buyer.status === "invalid" ? "例如：資金考量" : "追蹤中無需填寫"}
                      disabled={buyer.status === "tracking"}
                    />
                  </Field>
                  <div className="buyer-row-actions">
                    <button type="button" className="buyer-order-button" onClick={() => moveProspectiveBuyer(index, -1)} disabled={index === 0} aria-label={`將買方 ${index + 1} 上移`} title="上移">
                      <i className="bi bi-arrow-up" aria-hidden="true" />
                    </button>
                    <button type="button" className="buyer-order-button" onClick={() => moveProspectiveBuyer(index, 1)} disabled={index === report.prospectiveBuyers.length - 1} aria-label={`將買方 ${index + 1} 下移`} title="下移">
                      <i className="bi bi-arrow-down" aria-hidden="true" />
                    </button>
                    <button type="button" className="buyer-remove-button" onClick={() => removeProspectiveBuyer(index)} aria-label={`刪除買方 ${index + 1}`} title="刪除">
                      <i className="bi bi-trash3" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )) : <p className="buyer-admin-empty">目前尚未新增有望買方。</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading"><span>04</span><div><h2>周遭行情</h2><p>用總價、單價與近期成交呈現市場位置</p></div></div>
        <div className="form-grid three">
          <Field label="區域低標（萬）"><input type="number" value={report.marketLow} onChange={(e) => setNumber("marketLow", e.target.value)} /></Field>
          <Field label="區域中位（萬）"><input type="number" value={report.marketMedian} onChange={(e) => setNumber("marketMedian", e.target.value)} /></Field>
          <Field label="區域高標（萬）"><input type="number" value={report.marketHigh} onChange={(e) => setNumber("marketHigh", e.target.value)} /></Field>
          <Field label="目前開價（萬）"><input type="number" value={report.listingPrice} onChange={(e) => setNumber("listingPrice", e.target.value)} /></Field>
          <Field label="物件單價（萬／坪）"><input type="number" step="0.1" value={report.averagePingPrice} onChange={(e) => setNumber("averagePingPrice", e.target.value)} /></Field>
          <Field label="上週成交筆數"><input type="number" value={report.recentTransactions} onChange={(e) => setNumber("recentTransactions", e.target.value)} /></Field>
          <Field label="市場摘要" wide><textarea value={report.marketSummary} onChange={(e) => setText("marketSummary", e.target.value)} /></Field>
          <Field label="近期相似成交" hint="每行一筆，以｜分隔：物件｜說明｜總價｜單價" wide><textarea className="tall" value={report.comparableCases} onChange={(e) => setText("comparableCases", e.target.value)} /></Field>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading"><span>05</span><div><h2>591 瀏覽次數</h2><p>無需爬蟲，依 591 後台數據手動同步</p></div></div>
        <div className="form-grid three">
          <Field label="電腦瀏覽次數"><input type="number" value={report.view591Desktop} onChange={(e) => set591Device("view591Desktop", e.target.value)} /></Field>
          <Field label="手機瀏覽次數"><input type="number" value={report.view591Mobile} onChange={(e) => set591Device("view591Mobile", e.target.value)} /></Field>
          <Field label="累積瀏覽次數" hint="由電腦與手機自動加總"><input type="number" value={report.view591Count} readOnly /></Field>
          <Field label="近七日成長 %"><input type="number" step="0.1" value={report.view591Growth} onChange={(e) => setNumber("view591Growth", e.target.value)} /></Field>
          <Field label="最後同步時間"><input value={report.last591Sync} onChange={(e) => setText("last591Sync", e.target.value)} /></Field>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading"><span>06</span><div><h2>專員個人分析</h2><p>用白話整理市場回饋與下一步建議</p></div></div>
        <div className="form-grid">
          <Field label="分析重點" wide><input value={report.analysisHeadline} onChange={(e) => setText("analysisHeadline", e.target.value)} /></Field>
          <Field label="完整分析" wide><textarea className="tall" value={report.analysisBody} onChange={(e) => setText("analysisBody", e.target.value)} /></Field>
          <Field label="本期建議" wide><textarea value={report.recommendation} onChange={(e) => setText("recommendation", e.target.value)} /></Field>
          <Field label="專員姓名"><input value={report.agentName} onChange={(e) => setText("agentName", e.target.value)} /></Field>
          <Field label="職稱"><input value={report.agentTitle} onChange={(e) => setText("agentTitle", e.target.value)} /></Field>
          <Field label="聯絡電話"><input value={report.agentPhone} onChange={(e) => setText("agentPhone", e.target.value)} /></Field>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading"><span>07</span><div><h2>斡旋紀錄</h2><p>管理屋主頁右上角顯示的收斡旋紀錄</p></div></div>
        <div className="negotiation-admin-editor">
          <div className="buyer-admin-heading">
            <div><strong>收斡旋紀錄</strong><span>前台角標會自動顯示目前的紀錄筆數</span></div>
            <button type="button" className="buyer-add-button" onClick={addNegotiationRecord} disabled={report.negotiationRecords.length >= 50}>
              <i className="bi bi-file-earmark-plus" aria-hidden="true" />新增斡旋
            </button>
          </div>
          <div className="negotiation-admin-list">
            {report.negotiationRecords.length > 0 ? report.negotiationRecords.map((record, index) => (
              <div className="negotiation-admin-row" key={record.id}>
                <div className="negotiation-admin-row-heading">
                  <strong>第 {index + 1} 筆斡旋</strong>
                  <button type="button" onClick={() => removeNegotiationRecord(record.id)} aria-label={`刪除第 ${index + 1} 筆斡旋`}>
                    <i className="bi bi-trash3" aria-hidden="true" />刪除
                  </button>
                </div>
                <div className="form-grid three">
                  <Field label="買方名稱"><input value={record.buyerLabel} onChange={(event) => updateNegotiationRecord(record.id, { buyerLabel: event.target.value })} placeholder={`買方 ${index + 1}`} /></Field>
                  <Field label="收斡旋時間"><input type="datetime-local" value={record.receivedAt} onChange={(event) => updateNegotiationRecord(record.id, { receivedAt: event.target.value })} /></Field>
                  <Field label="目前狀態">
                    <select value={record.status} onChange={(event) => updateNegotiationRecord(record.id, { status: event.target.value as NegotiationRecord["status"] })}>
                      <option value="negotiating">協商中</option>
                      <option value="accepted">已成交</option>
                      <option value="declined">未成立</option>
                      <option value="withdrawn">已撤回</option>
                    </select>
                  </Field>
                  <Field label="買方出價（萬元）"><input type="number" min="0" step="0.01" value={record.offerPrice ?? ""} onChange={(event) => updateNegotiationRecord(record.id, { offerPrice: event.target.value === "" ? null : Number(event.target.value) })} placeholder="待補" /></Field>
                  <Field label="斡旋金（萬元）"><input type="number" min="0" step="0.01" value={record.earnestMoney ?? ""} onChange={(event) => updateNegotiationRecord(record.id, { earnestMoney: event.target.value === "" ? null : Number(event.target.value) })} placeholder="待補" /></Field>
                  <Field label="進度備註" wide><textarea value={record.note} onChange={(event) => updateNegotiationRecord(record.id, { note: event.target.value })} placeholder="例如：已向屋主呈報，買賣雙方持續協商中" /></Field>
                </div>
              </div>
            )) : <p className="buyer-admin-empty">目前沒有斡旋紀錄，前台不會顯示斡旋按鈕。</p>}
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading"><span>08</span><div><h2>公告中心</h2><p>發布新公告並保留過往公告紀錄</p></div></div>
        <div className="form-grid">
          <button type="button" className={`announcement-toggle wide ${report.announcementEnabled ? "is-enabled" : ""}`} role="switch" aria-checked={report.announcementEnabled} onClick={() => setReport((current) => ({ ...current, announcementEnabled: !current.announcementEnabled }))}>
            <span className="announcement-toggle-control" aria-hidden="true"><i className="bi bi-check-lg" /></span><span className="announcement-toggle-copy"><strong>啟用公告中心</strong><small>開啟時，前台右上角會顯示公告入口；公告不會再自動彈出。</small></span>
          </button>
          <div className="announcement-compose-heading wide">
            <div><strong>撰寫新公告</strong><span>儲存所有變更時會正式發布，並自動加入公告歷史。</span></div>
            <span className="announcement-new-window"><i className="bi bi-clock" aria-hidden="true" />發布後 24 小時顯示未讀</span>
          </div>
          <Field label="公告標題" wide><input value={announcementDraft.title} onChange={(event) => setAnnouncementDraftValue({ title: event.target.value })} placeholder="例如：本週帶看與曝光更新" /></Field>
          <Field label="公告內容" hint="可直接換行，前台會逐行顯示。" wide><textarea className="tall" value={announcementDraft.body} onChange={(event) => setAnnouncementDraftValue({ body: event.target.value })} placeholder={"例如：\n本週賞屋持續進行中\n謝謝屋主耐心配合"} /></Field>
          <div className="announcement-image-field wide">
            <span>公告照片</span>
            <div className="announcement-image-editor">
              {announcementDraft.imageUrl ? (
                <div className="announcement-image-preview">
                  <img src={announcementDraft.imageUrl} alt="公告照片預覽" />
                  <button type="button" onClick={() => setAnnouncementDraftValue({ imageUrl: "" })}><i className="bi bi-trash3" aria-hidden="true" />移除照片</button>
                </div>
              ) : <div className="announcement-image-empty"><i className="bi bi-image" aria-hidden="true" /><span>尚未上傳公告照片</span></div>}
              <div className="announcement-image-actions">
                <label className={`announcement-upload-button ${uploadingAnnouncementImage ? "is-uploading" : ""}`}>
                  <i className={`bi ${uploadingAnnouncementImage ? "bi-arrow-repeat" : "bi-cloud-arrow-up"}`} aria-hidden="true" />
                  <span>{uploadingAnnouncementImage ? "照片上傳中…" : announcementDraft.imageUrl ? "更換照片" : "選擇照片"}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAnnouncementImage} disabled={uploadingAnnouncementImage} />
                </label>
                <small>支援 JPG、PNG、WebP，單張最多 6 MB。填寫標題後按「儲存所有變更」即可發布。</small>
              </div>
            </div>
          </div>
          <div className="announcement-admin-history wide">
            <div className="announcement-admin-history-heading">
              <div><strong>歷史公告</strong><span>共 {report.announcements.length} 則，最新公告會排在最上方。</span></div>
            </div>
            <div className="announcement-admin-history-list">
              {report.announcements.length > 0 ? report.announcements.map((announcement, index) => (
                <div className="announcement-admin-history-row" key={announcement.id}>
                  <span className="announcement-admin-history-index">{index + 1}</span>
                  <div className="announcement-admin-history-copy">
                    <time dateTime={announcement.publishedAt}>{formatAnnouncementTime(announcement.publishedAt)}</time>
                    <strong>{announcement.title || "未命名公告"}</strong>
                    {announcement.body && <p>{announcement.body}</p>}
                  </div>
                  {announcement.imageUrl && <img src={announcement.imageUrl} alt="" />}
                  <button
                    type="button"
                    className={`announcement-history-toggle ${announcement.enabled ? "is-enabled" : ""}`}
                    role="switch"
                    aria-checked={announcement.enabled}
                    onClick={() => updateAnnouncementVisibility(announcement.id, !announcement.enabled)}
                  >
                    <span aria-hidden="true" />
                    {announcement.enabled ? "顯示中" : "已下架"}
                  </button>
                </div>
              )) : <p className="announcement-admin-history-empty">尚無歷史公告，發布第一則公告後會顯示在這裡。</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="sticky-save"><span>{message || "變更尚未儲存"}</span><button className="save-button" type="submit" disabled={saving || uploadingAnnouncementImage}>{saving ? "儲存中…" : uploadingAnnouncementImage ? "照片上傳中…" : "儲存所有變更"}</button></div>
    </form>
  </main>;
}
