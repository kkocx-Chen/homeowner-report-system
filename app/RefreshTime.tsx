"use client";

import { useEffect, useState } from "react";

export function RefreshTime() {
  const [loadedAt, setLoadedAt] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLoadedAt(new Intl.DateTimeFormat("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date()));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <span className="live-pill" aria-label={loadedAt ? `頁面於 ${loadedAt} 更新` : "正在讀取更新時間"}>
      <i />
      <time>{loadedAt ? `${loadedAt} 更新` : "載入中"}</time>
    </span>
  );
}
