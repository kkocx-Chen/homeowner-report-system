export type ProspectiveBuyer = {
  title: string;
  status: "tracking" | "invalid";
  reason: string;
  progress: string;
  revisitTime: string;
};

export type Announcement = {
  id: string;
  enabled: boolean;
  title: string;
  body: string;
  imageUrl: string;
  publishedAt: string;
};

export type NegotiationRecord = {
  id: string;
  buyerLabel: string;
  receivedAt: string;
  offerPrice: number | null;
  earnestMoney: number | null;
  status: "negotiating" | "accepted" | "declined" | "withdrawn";
  note: string;
  createdAt: string;
};

export type PropertyReport = {
  propertyName: string;
  address: string;
  reportPeriod: string;
  saleStatus: string;
  statusNote: string;
  viewingCount: number;
  viewingTimes: string[];
  viewingThisWeek: number;
  viewingThisWeekTimes: string[];
  viewingGrowth: number;
  viewingTrend: number[];
  prospectiveBuyers: ProspectiveBuyer[];
  marketLow: number;
  marketMedian: number;
  marketHigh: number;
  listingPrice: number;
  averagePingPrice: number;
  recentTransactions: number;
  marketSummary: string;
  comparableCases: string;
  view591Count: number;
  view591Desktop: number;
  view591Mobile: number;
  view591Growth: number;
  last591Sync: string;
  analysisHeadline: string;
  analysisBody: string;
  recommendation: string;
  agentName: string;
  agentTitle: string;
  agentPhone: string;
  announcementEnabled: boolean;
  announcements: Announcement[];
  negotiationRecords: NegotiationRecord[];
  updatedAt: string;
};

export const defaultReport: PropertyReport = {
  propertyName: "時上S",
  address: "台北市大安區通化街靜巷・專任委託",
  reportPeriod: "2026 年 7 月銷售月報",
  saleStatus: "積極推廣中",
  statusNote: "曝光與詢問穩定成長",
  viewingCount: 17,
  viewingTimes: [],
  viewingThisWeek: 5,
  viewingThisWeekTimes: ["", "", "", "", ""],
  viewingGrowth: 28.6,
  viewingTrend: [4, 4, 4, 5],
  prospectiveBuyers: [
    { title: "有望買方 A", status: "tracking", reason: "", progress: "", revisitTime: "" },
    { title: "有望買方 B", status: "tracking", reason: "", progress: "", revisitTime: "" },
  ],
  marketLow: 1280,
  marketMedian: 1390,
  marketHigh: 1520,
  listingPrice: 1458,
  averagePingPrice: 66.2,
  recentTransactions: 9,
  marketSummary: "近三個月同類型兩房成交量穩定，總價帶主要落在 1,350–1,500 萬之間。",
  comparableCases: "通化名廈｜同路段・24.1 坪｜1,430 萬｜59.3 萬/坪\n安和雅居｜步行 6 分・27.8 坪｜1,520 萬｜54.7 萬/坪\n敦南小品｜屋齡相近・25.2 坪｜1,368 萬｜54.3 萬/坪",
  view591Count: 4729,
  view591Desktop: 962,
  view591Mobile: 3767,
  view591Growth: 30,
  last591Sync: "今日 09:30",
  analysisHeadline: "詢問品質正在提升，現在是聚焦高意願買方的好時機。",
  analysisBody: "本期賞屋人數與 591 曝光同步上升，其中首購與新婚族群的停留時間最長。買方普遍肯定採光與生活機能，主要考量集中在收納與開價。整體市場回饋仍在健康範圍。",
  recommendation: "維持現行開價兩週，優先追蹤 2 組已有資金規劃的買方；若二次帶看後仍未出價，再評估以軟裝調整強化空間感。",
  agentName: "陳政揚",
  agentTitle: "專任不動產顧問",
  agentPhone: "0912-345-678",
  announcementEnabled: false,
  announcements: [],
  negotiationRecords: [{
    id: "negotiation-1",
    buyerLabel: "買方 1",
    receivedAt: "",
    offerPrice: null,
    earnestMoney: null,
    status: "negotiating",
    note: "",
    createdAt: "2026-08-24T00:00:00.000Z",
  }],
  updatedAt: "2026-08-06T01:30:00.000Z",
};

export const viewingHistoryStartDate = "2026-08-13";

export function isViewingOnOrAfterHistoryStart(value: string) {
  const date = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())?.[1];
  return Boolean(date && date >= viewingHistoryStartDate);
}

export function parseComparableCases(value: string) {
  return value.split("\n").filter(Boolean).slice(0, 5).map((line) => {
    const [name = "相似物件", detail = "鄰近區域", price = "—", unit = ""] = line.split("｜");
    return { name, detail, price, unit };
  });
}
