"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProspectiveBuyer } from "../lib/report";

export function ProspectiveBuyers({ buyers }: { buyers: ProspectiveBuyer[] }) {
  const [open, setOpen] = useState(false);
  const [activeBuyerIndex, setActiveBuyerIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const buyerButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const trackingCount = buyers.filter((buyer) => buyer.status === "tracking").length;
  const activeBuyer = activeBuyerIndex === null ? null : buyers[activeBuyerIndex];

  useEffect(() => {
    if (activeBuyerIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const buyerIndex = activeBuyerIndex;
      setActiveBuyerIndex(null);
      window.requestAnimationFrame(() => buyerButtonRefs.current[buyerIndex]?.focus());
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeBuyerIndex]);

  const closeBuyerCard = () => {
    const buyerIndex = activeBuyerIndex;
    setActiveBuyerIndex(null);
    if (buyerIndex !== null) window.requestAnimationFrame(() => buyerButtonRefs.current[buyerIndex]?.focus());
  };

  const buyerCard = activeBuyer && typeof document !== "undefined" ? createPortal(
    <div className="buyer-modal-backdrop">
      <button type="button" className="buyer-modal-dismiss" onClick={closeBuyerCard} aria-label="關閉買方進度卡片" tabIndex={-1} />
      <section className="buyer-modal-card" role="dialog" aria-modal="true" aria-labelledby="buyer-modal-title">
        <button ref={closeButtonRef} type="button" className="buyer-modal-close" onClick={closeBuyerCard} aria-label="關閉買方進度卡片">
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
        <span className="buyer-modal-icon" aria-hidden="true"><i className="bi bi-person-check-fill" /></span>
        <p className="buyer-modal-kicker">有望買方進度</p>
        <div className="buyer-modal-heading">
          <h3 id="buyer-modal-title">{activeBuyer.title}</h3>
          {activeBuyer.status === "tracking" ? (
            <span className="prospect-status tracking">追蹤中</span>
          ) : (
            <span className="prospect-status invalid">{activeBuyer.reason || "已確認無效"}</span>
          )}
        </div>
        <div className="buyer-modal-details">
          <div className="buyer-modal-detail">
            <span>目前進度：</span>
            <strong>{activeBuyer.progress || "尚未填寫"}</strong>
          </div>
          <div className="buyer-modal-detail">
            <span>複看時間：</span>
            <strong>{activeBuyer.revisitTime || "尚未安排"}</strong>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <div className="prospect-accordion">
        <button
          type="button"
          className="prospect-trigger"
          aria-expanded={open}
          aria-controls="prospective-buyers-panel"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="prospect-trigger-icon" aria-hidden="true"><i className="bi bi-person-check-fill" /></span>
          <span className="prospect-trigger-copy">
            <strong>有望買方</strong>
            <small>{buyers.length > 0 ? `${buyers.length} 組買方進度` : "目前尚未新增"}</small>
          </span>
          {trackingCount > 0 && <span className="prospect-tracking-count">{trackingCount} 組追蹤中</span>}
          <i className="bi bi-chevron-down prospect-chevron" aria-hidden="true" />
        </button>

        <div
          id="prospective-buyers-panel"
          className={`prospect-panel ${open ? "is-open" : ""}`}
          aria-hidden={!open}
        >
          <div className="prospect-panel-inner">
            <div className="prospect-list" role="region" aria-label="有望買方名單">
              {buyers.length > 0 ? buyers.map((buyer, index) => (
                <div className="prospect-item-card" key={`${buyer.title}-${index}`}>
                  <button
                    ref={(node) => { buyerButtonRefs.current[index] = node; }}
                    type="button"
                    className="prospect-item"
                    aria-haspopup="dialog"
                    onClick={() => setActiveBuyerIndex(index)}
                  >
                    <span className="prospect-title">{buyer.title}</span>
                    <span className="prospect-item-meta">
                      {buyer.status === "tracking" ? (
                        <span className="prospect-status tracking">追蹤中</span>
                      ) : (
                        <span className="prospect-status invalid">{buyer.reason || "已確認無效"}</span>
                      )}
                      <i className="bi bi-chevron-right prospect-item-chevron" aria-hidden="true" />
                    </span>
                  </button>
                </div>
              )) : <p className="prospect-empty">目前尚無有望買方</p>}
            </div>
          </div>
        </div>
      </div>
      {buyerCard}
    </>
  );
}
