"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Announcement } from "../lib/report";

const NEW_ANNOUNCEMENT_DURATION = 24 * 60 * 60 * 1000;

function announcementTime(value: string) {
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

export function AnnouncementCenter({ enabled, announcements }: { enabled: boolean; announcements: Announcement[] }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const visibleAnnouncements = useMemo(() => announcements
    .filter((announcement) => announcement.enabled)
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()), [announcements]);
  const recentCount = now === 0 ? 0 : visibleAnnouncements.filter((announcement) => {
    const publishedAt = new Date(announcement.publishedAt).getTime();
    const age = now - publishedAt;
    return Number.isFinite(publishedAt) && age >= 0 && age < NEW_ANNOUNCEMENT_DURATION;
  }).length;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      setNow(Date.now());
    });
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
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

  if (!enabled || visibleAnnouncements.length === 0) return null;

  return (
    <>
      <button type="button" className="announcement-pill" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <i className="bi bi-megaphone-fill" aria-hidden="true" />
        <span>公告</span>
        {recentCount > 0 && <em className="announcement-unread">未讀 {recentCount}</em>}
      </button>
      {mounted && open && createPortal(
        <div className="announcement-modal-backdrop">
          <button type="button" className="announcement-modal-dismiss" onClick={() => setOpen(false)} aria-label="關閉公告中心" tabIndex={-1} />
          <section className="announcement-modal-card announcement-center-card" role="dialog" aria-modal="true" aria-labelledby="announcement-center-title">
            <button ref={closeButtonRef} type="button" className="announcement-modal-close" onClick={() => setOpen(false)} aria-label="關閉公告中心">
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
            <div className="announcement-center-heading">
              <span className="announcement-modal-icon" aria-hidden="true"><i className="bi bi-megaphone-fill" /></span>
              <div>
                <p>ANNOUNCEMENT</p>
                <h2 id="announcement-center-title">公告中心</h2>
                <span>共 {visibleAnnouncements.length} 則公告</span>
              </div>
            </div>
            <div className="announcement-history-list">
              {visibleAnnouncements.map((announcement, index) => (
                <details className="announcement-history-item" key={announcement.id} open={index === 0}>
                  <summary>
                    <span className="announcement-history-marker" aria-hidden="true" />
                    <span className="announcement-history-summary">
                      <span className="announcement-history-meta">
                        <time dateTime={announcement.publishedAt}>{announcementTime(announcement.publishedAt)}</time>
                        {index === 0 && <em>最新</em>}
                      </span>
                      <strong>{announcement.title || "最新公告"}</strong>
                    </span>
                    <i className="bi bi-chevron-down" aria-hidden="true" />
                  </summary>
                  <div className="announcement-history-content">
                    {announcement.imageUrl && <img src={announcement.imageUrl} alt={`${announcement.title || "公告"} 圖片`} />}
                    {announcement.body.trim() && <p>{announcement.body}</p>}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
