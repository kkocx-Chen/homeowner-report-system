"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Announcement } from "../lib/report";

function getDismissalKey(announcement: Announcement) {
  const content = `${announcement.title}\n${announcement.body}\n${announcement.imageUrl}`;
  let hash = 2166136261;

  for (const character of content) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return `homeowner-report:announcement-dismissed:${(hash >>> 0).toString(36)}`;
}

export function AnnouncementModal({ announcement }: { announcement: Announcement }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissPermanently, setDismissPermanently] = useState(false);
  const [dismissError, setDismissError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dismissalKey = getDismissalKey(announcement);

  function dismissAnnouncement(checked: boolean) {
    setDismissPermanently(checked);
    setDismissError("");

    try {
      if (checked) {
        window.localStorage.setItem(dismissalKey, "true");
        setOpen(false);
      } else {
        window.localStorage.removeItem(dismissalKey);
      }
    } catch {
      setDismissPermanently(!checked);
      setDismissError("無法儲存這台裝置的顯示偏好，請稍後再試。");
    }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      if (!announcement.enabled) return;

      try {
        const dismissed = window.localStorage.getItem(dismissalKey) === "true";
        setDismissPermanently(dismissed);
        setOpen(!dismissed);
      } catch {
        setOpen(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [announcement.enabled, dismissalKey]);

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

  if (!announcement.enabled) return null;

  const title = announcement.title || "最新公告";
  const hasBody = Boolean(announcement.body.trim());

  return (
    <>
      <button type="button" className="announcement-pill" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <i className="bi bi-megaphone-fill" aria-hidden="true" />
        <span>公告</span>
      </button>
      {mounted && open && createPortal(
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
                  onChange={(event) => dismissAnnouncement(event.target.checked)}
                />
                <span>不再自動顯示此公告</span>
              </label>
              {dismissError && <p role="alert">{dismissError}</p>}
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
