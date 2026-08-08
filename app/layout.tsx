import type { Metadata } from "next";
import { headers } from "next/headers";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const rawHost = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const host = /^[a-z0-9.:-]+$/i.test(rawHost) ? rawHost : "localhost:3000";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "https" ? "https" : host.startsWith("localhost") ? "http" : "https";
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: {
      default: "時上S｜房屋銷售回報",
      template: "%s｜時上S",
    },
    description: "讓屋主清楚掌握賞屋人數、周遭行情、591 曝光與專員建議。",
    icons: { icon: "/safe-fill.svg", shortcut: "/safe-fill.svg" },
    openGraph: {
      title: "時上S｜房屋銷售進度報告",
      description: "每一個數字，都為下一次成交準備。",
      type: "website",
      locale: "zh_TW",
    },
    twitter: {
      card: "summary_large_image",
      title: "時上S｜房屋銷售進度報告",
      description: "每一個數字，都為下一次成交準備。",
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
