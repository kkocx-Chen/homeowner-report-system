"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Announcement } from "../lib/report";

export function AnnouncementModal({ announcement }: { announcement: Announcement }) {
  const [open, setOpen] = useState(announcement.enabled);
  const [dismissPermanently, setDismissPermanently] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [dismissError, setDismissError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  async function dismissAnnouncement(checked: boolean) {
    setDismissPermanently(checked);
    if (!checked) return;

    setDismissError("");
    setDismissing(true);

    try {
      const response = await fetch("/api/announcement-dismiss", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "公告下架失敗");

      setOpen(false);
    } catch (error) {
      setDismissPermanently(false);
      setDismissError(error instanceof Error ? error.message : "暫時無法下架公告，請稍後再試。");
    } finally {
      setDismissing(false);
    }
  }

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

  if (!announcement.enabled || !open || typeof document === "undefined") return null;

  const title = announcement.title || "最新公告";
  const hasBody = Boolean(announcement.body.trim());

  return createPortal(
    <div className="announcement-modal-backdrop">
      <button type="button" className="announcement-modal-dismiss" onClick={() => setOpen(false)} aria-label="關閉公告" tabIndex={-1} />
      <section className="announcement-modal-card" role="dialog" aria-modal="true" aria-labelledby="announcement-modal-title" aria-describedby={hasBody ? "announcement-modal-body" : undefined}>
        <button ref={closeButtonRef} type="button" className="announcement-modal-close" onClick={() => setOpen(false)} aria-label="關閉公告">
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
        <div className="announcement-modal-heading">
          <span className="announcement-modal-icon" aria-hidden="true"><i className="bi bi-megaphone-fill" /></span>
          <p>最新公告</p>
          <h2 id="announcement-modal-title">{title}</h2>
        </div>
        {announcement.imageUrl && <img className="announcement-modal-image" src={announcement.imageUrl} alt={`${title} 圖片`} />}
        {hasBody && <p className="announcement-modal-body" id="announcement-modal-body">{announcement.body}</p>}
        <div className="announcement-dismiss-option">
          <label>
            <input
              type="checkbox"
              checked={dismissPermanently}
              disabled={dismissing}
              onChange={(event) => dismissAnnouncement(event.target.checked)}
            />
            <span>不再顯示此公告</span>
          </label>
          {dismissError && <p role="alert">{dismissError}</p>}
        </div>
      </section>
    </div>,
    document.body,
  );
}
