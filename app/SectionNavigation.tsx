"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "overview", label: "概況", icon: "bi-grid-1x2-fill" },
  { id: "analysis", label: "分析", icon: "bi-clipboard-data" },
];

export function SectionNavigation() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const boundary = (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 80) + 48;
      let current = "overview";
      for (const section of sections) {
        if ((document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity) <= boundary) current = section.id;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) current = "analysis";
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return <nav className="mini-tabbar" aria-label="頁面導覽">
    {sections.map(({ id, label, icon }) => (
      <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>
        <i className={`bi ${icon}`} aria-hidden="true" />{label}
      </a>
    ))}
    <a href="https://line.me/ti/p/ng4Rg_uhNN" aria-label="透過 LINE 聯絡陳政揚"><i className="bi bi-line" aria-hidden="true" />聯絡</a>
  </nav>;
}
