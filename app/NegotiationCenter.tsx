"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NegotiationRecord } from "../lib/report";

const statusLabels: Record<NegotiationRecord["status"], string> = {
  negotiating: "協商中",
  accepted: "已成交",
  declined: "未成立",
  withdrawn: "已撤回",
};

function formatReceivedAt(value: string) {
  if (!value) return "收件時間待補";
  const localDateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (localDateTime) return `${localDateTime[1]}/${localDateTime[2]}/${localDateTime[3]} ${localDateTime[4]}:${localDateTime[5]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

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

function amount(value: number | null) {
  return value === null ? "待補" : `${value} 萬元`;
}

export function NegotiationCenter({ records }: { records: NegotiationRecord[] }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sortedRecords = records
    .map((record, sourceIndex) => ({ record, sourceIndex }))
    .sort((left, right) => {
      const leftReceivedAt = left.record.receivedAt ? new Date(left.record.receivedAt).getTime() : null;
      const rightReceivedAt = right.record.receivedAt ? new Date(right.record.receivedAt).getTime() : null;

      if (leftReceivedAt !== null && rightReceivedAt !== null && leftReceivedAt !== rightReceivedAt) {
        return rightReceivedAt - leftReceivedAt;
      }
      if (leftReceivedAt !== null && rightReceivedAt === null) return -1;
      if (leftReceivedAt === null && rightReceivedAt !== null) return 1;

      const leftCreatedAt = new Date(left.record.createdAt).getTime();
      const rightCreatedAt = new Date(right.record.createdAt).getTime();
      if (leftCreatedAt !== rightCreatedAt) return rightCreatedAt - leftCreatedAt;

      return right.sourceIndex - left.sourceIndex;
    })
    .map(({ record }) => record);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (records.length === 0) return null;

  return (
    <>
      <button type="button" className="negotiation-pill" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <i className="bi bi-cash-coin" aria-hidden="true" />
        <span>斡旋</span>
        <em className="negotiation-count" aria-label={`${records.length} 筆斡旋紀錄`}>{records.length}</em>
      </button>
      {mounted && open && createPortal(
        <div className="announcement-modal-backdrop">
          <button type="button" className="announcement-modal-dismiss" onClick={() => setOpen(false)} aria-label="關閉斡旋紀錄" tabIndex={-1} />
          <section className="announcement-modal-card negotiation-modal-card" role="dialog" aria-modal="true" aria-labelledby="negotiation-center-title">
            <button ref={closeButtonRef} type="button" className="announcement-modal-close" onClick={() => setOpen(false)} aria-label="關閉斡旋紀錄">
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
            <div className="negotiation-modal-heading">
              <span className="negotiation-modal-icon" aria-hidden="true"><i className="bi bi-cash-coin" /></span>
              <div>
                <p>NEGOTIATION RECORDS</p>
                <h2 id="negotiation-center-title">收斡旋紀錄</h2>
                <span>目前共 {records.length} 筆</span>
              </div>
            </div>
            <div className="negotiation-record-list">
              {sortedRecords.map((record, index) => (
                <article className="negotiation-record" key={record.id}>
                  <div className="negotiation-record-heading">
                    <div>
                      <time dateTime={record.receivedAt}>{formatReceivedAt(record.receivedAt)}</time>
                      <h3>{record.buyerLabel || `買方 ${index + 1}`}</h3>
                    </div>
                    <span className={`negotiation-status is-${record.status}`}>{statusLabels[record.status]}</span>
                  </div>
                  <div className="negotiation-amounts">
                    <div><span>買方出價</span><strong>{amount(record.offerPrice)}</strong></div>
                    <div><span>斡旋金</span><strong>{amount(record.earnestMoney)}</strong></div>
                  </div>
                  {record.note && <div className="negotiation-note"><span>進度備註</span><p>{record.note}</p></div>}
                </article>
              ))}
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
