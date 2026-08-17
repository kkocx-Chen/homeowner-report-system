"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RollingNumber } from "./RollingNumber";

function formatViewingTime(value: string) {
  const dateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (dateTime) return `${Number(dateTime[2])} 月 ${Number(dateTime[3])} 日 · ${dateTime[4]}:${dateTime[5]}`;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) return `${Number(dateOnly[2])} 月 ${Number(dateOnly[3])} 日`;
  return value.trim() || "時間尚未填寫";
}

type ViewingDetailsProps = {
  times: string[];
  groups: number;
  label: string;
  kicker: string;
  title: string;
  emptyMessage: string;
  modalTitleId: string;
  closeLabel: string;
  tone?: "weekly" | "total";
  maxGroups?: number;
};

function ViewingDetails({ times, groups, label, kicker, title, emptyMessage, modalTitleId, closeLabel, tone = "weekly", maxGroups = 50 }: ViewingDetailsProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const groupCount = Math.max(0, Math.min(maxGroups, Math.round(groups)));
  const viewingTimes = tone === "total"
    ? times.slice(0, maxGroups)
    : Array.from({ length: groupCount }, (_, index) => times?.[index] ?? "");
  const modalCount = tone === "total" ? viewingTimes.length : groupCount;

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const closeDetails = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const modal = open && typeof document !== "undefined" ? createPortal(
    <div className="buyer-modal-backdrop">
      <button type="button" className="buyer-modal-dismiss" onClick={closeDetails} aria-label={closeLabel} tabIndex={-1} />
      <section className={`buyer-modal-card viewing-modal-card ${tone === "total" ? "total-viewing-modal-card" : ""}`} role="dialog" aria-modal="true" aria-labelledby={modalTitleId}>
        <button ref={closeButtonRef} type="button" className="buyer-modal-close" onClick={closeDetails} aria-label={closeLabel}>
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
        <span className="buyer-modal-icon viewing-modal-icon" aria-hidden="true"><i className="bi bi-calendar2-check-fill" /></span>
        <p className="buyer-modal-kicker">{kicker}</p>
        <div className="buyer-modal-heading">
          <h3 id={modalTitleId}>{title}</h3>
          <span className="viewing-modal-count">{modalCount} {tone === "total" ? "筆" : "組"}</span>
        </div>
        <div className="viewing-time-list">
          {viewingTimes.length > 0 ? viewingTimes.map((time, index) => (
            <div className="viewing-time-row" key={index}>
              <span className="viewing-time-index">{index + 1}</span>
              <div>
                <small>第 {index + 1} 組</small>
                <strong>{formatViewingTime(time)}</strong>
              </div>
            </div>
          )) : <p className="viewing-time-empty">{emptyMessage}</p>}
        </div>
      </section>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button ref={triggerRef} type="button" className={`viewing-stat viewing-stat-button ${tone === "total" ? "total-viewing-stat-button" : ""}`} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span>{label}</span>
        <div><strong><RollingNumber value={groups} /></strong><small>組</small></div>
        <i className="bi bi-chevron-right viewing-stat-chevron" aria-hidden="true" />
      </button>
      {modal}
    </>
  );
}

export function WeeklyViewingDetails({ times, groups }: { times: string[]; groups: number }) {
  return <ViewingDetails times={times} groups={groups} label="本週賞屋人數" kicker="本週賞屋紀錄" title="每組帶看時間" emptyMessage="本週尚無帶看紀錄" modalTitleId="weekly-viewing-modal-title" closeLabel="關閉本週帶看時間" />;
}

export function TotalViewingDetails({ times, groups }: { times: string[]; groups: number }) {
  return <ViewingDetails times={times} groups={groups} label="總賞屋人數" kicker="帶看時間紀錄" title="已登錄帶看時間" emptyMessage="尚無可查詢的帶看時間" modalTitleId="total-viewing-modal-title" closeLabel="關閉帶看時間紀錄" tone="total" maxGroups={200} />;
}
