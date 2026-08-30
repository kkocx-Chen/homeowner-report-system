import { randomUUID } from "node:crypto";
import { isAdmin } from "../../../lib/admin-auth";
import { isAnnouncementImageUrl, removeAnnouncementImage } from "../../../lib/announcement-image";
import { defaultReport, isViewingOnOrAfterHistoryStart, type NegotiationRecord, type PropertyReport } from "../../../lib/report";
import { getReport, writeReport } from "../../../lib/report-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ report: await getReport() });
  } catch {
    return Response.json({ report: defaultReport, preview: true });
  }
}

function cleanReport(value: Partial<PropertyReport>, previousReport: PropertyReport): PropertyReport {
  const text = (key: keyof PropertyReport, limit = 3000) => String(value[key] ?? defaultReport[key]).trim().slice(0, limit);
  const numeric = (key: keyof PropertyReport) => {
    const parsed = Number(value[key]);
    return Number.isFinite(parsed) ? parsed : Number(defaultReport[key]);
  };
  const trend = Array.isArray(value.viewingTrend)
    ? value.viewingTrend.map(Number).filter(Number.isFinite).slice(-4)
    : defaultReport.viewingTrend;
  const viewingCount = Math.max(0, Math.min(200, Math.round(numeric("viewingCount"))));
  const submittedCumulativeViewingTimes = Array.isArray(value.viewingTimes) ? value.viewingTimes : [];
  const viewingTimes = submittedCumulativeViewingTimes
    .map((viewingTime) => String(viewingTime ?? "").trim().slice(0, 60))
    .filter((viewingTime) => viewingTime && isViewingOnOrAfterHistoryStart(viewingTime))
    .slice(0, 200);
  const viewingThisWeek = Math.max(0, Math.min(50, Math.round(numeric("viewingThisWeek"))));
  const submittedViewingTimes = Array.isArray(value.viewingThisWeekTimes) ? value.viewingThisWeekTimes : [];
  const viewingThisWeekTimes = Array.from(
    { length: viewingThisWeek },
    (_, index) => String(submittedViewingTimes[index] ?? "").trim().slice(0, 60),
  );
  const prospectiveBuyers = (Array.isArray(value.prospectiveBuyers) ? value.prospectiveBuyers : defaultReport.prospectiveBuyers)
    .slice(0, 20)
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const buyer = item as Record<string, unknown>;
      const title = String(buyer.title ?? "").trim().slice(0, 80);
      if (!title) return [];
      const status = buyer.status === "invalid" ? "invalid" as const : "tracking" as const;
      const reason = status === "invalid"
        ? String(buyer.reason ?? "").trim().slice(0, 160) || "已確認無效"
        : "";
      const progress = String(buyer.progress ?? "").trim().slice(0, 500);
      const revisitTime = String(buyer.revisitTime ?? "").trim().slice(0, 100);
      return [{ title, status, reason, progress, revisitTime }];
    });
  const previousAnnouncements = new Map(previousReport.announcements.map((announcement) => [announcement.id, announcement]));
  const announcements = (Array.isArray(value.announcements) ? value.announcements : previousReport.announcements)
    .slice(0, 100)
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const submitted = item as Record<string, unknown>;
      const title = String(submitted.title ?? "").trim().slice(0, 120);
      if (!title) return [];
      const submittedId = String(submitted.id ?? "").trim().slice(0, 100);
      const previous = previousAnnouncements.get(submittedId);
      return [{
        id: previous?.id ?? randomUUID(),
        enabled: submitted.enabled !== false,
        title,
        body: String(submitted.body ?? "").trim().slice(0, 3000),
        imageUrl: isAnnouncementImageUrl(submitted.imageUrl) ? submitted.imageUrl : "",
        publishedAt: previous?.publishedAt ?? new Date().toISOString(),
      }];
    })
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());
  const previousNegotiations = new Map(previousReport.negotiationRecords.map((record) => [record.id, record]));
  const negotiationRecords = (Array.isArray(value.negotiationRecords) ? value.negotiationRecords : previousReport.negotiationRecords)
    .slice(0, 50)
    .flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const submitted = item as Record<string, unknown>;
      const submittedId = String(submitted.id ?? "").trim().slice(0, 100);
      const previous = previousNegotiations.get(submittedId);
      const optionalAmount = (amount: unknown) => {
        if (amount === "" || amount === null || amount === undefined) return null;
        const parsed = Number(amount);
        return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null;
      };
      const submittedStatus = String(submitted.status ?? "");
      const status: NegotiationRecord["status"] = submittedStatus === "accepted" || submittedStatus === "declined" || submittedStatus === "withdrawn"
        ? submittedStatus
        : "negotiating";

      return [{
        id: previous?.id ?? randomUUID(),
        buyerLabel: String(submitted.buyerLabel ?? `買方 ${index + 1}`).trim().slice(0, 80) || `買方 ${index + 1}`,
        receivedAt: String(submitted.receivedAt ?? "").trim().slice(0, 60),
        offerPrice: optionalAmount(submitted.offerPrice),
        earnestMoney: optionalAmount(submitted.earnestMoney),
        status,
        note: String(submitted.note ?? "").trim().slice(0, 1200),
        createdAt: previous?.createdAt ?? new Date().toISOString(),
      }];
    });
  const submittedTerminationNotice = value.terminationNotice && typeof value.terminationNotice === "object"
    ? value.terminationNotice
    : previousReport.terminationNotice;
  const submittedTerminationTime = String(submittedTerminationNotice.terminatedAt ?? "").trim();
  const terminationNotice = {
    enabled: submittedTerminationNotice.enabled === true,
    terminatedAt: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(submittedTerminationTime) ? submittedTerminationTime : "",
  };
  const submittedConveyancingProcess = value.conveyancingProcess && typeof value.conveyancingProcess === "object"
    ? value.conveyancingProcess
    : previousReport.conveyancingProcess;
  const submittedConveyancingStep = String(submittedConveyancingProcess.currentStep ?? "");
  const conveyancingStep = submittedConveyancingStep === "offer" || submittedConveyancingStep === "meeting"
    || submittedConveyancingStep === "contract" || submittedConveyancingStep === "seal"
    || submittedConveyancingStep === "tax" || submittedConveyancingStep === "transfer"
    || submittedConveyancingStep === "handover"
    ? submittedConveyancingStep
    : defaultReport.conveyancingProcess.currentStep;
  const submittedConveyancingDate = String(submittedConveyancingProcess.scheduledDate ?? "").trim();
  const conveyancingProcess = {
    enabled: !terminationNotice.enabled && submittedConveyancingProcess.enabled === true,
    currentStep: conveyancingStep,
    scheduledDate: /^\d{4}-\d{2}-\d{2}$/.test(submittedConveyancingDate) ? submittedConveyancingDate : "",
  };

  return {
    propertyName: text("propertyName", 80), address: text("address", 160), reportPeriod: text("reportPeriod", 80),
    saleStatus: text("saleStatus", 40), statusNote: text("statusNote", 120), viewingCount, viewingTimes,
    viewingThisWeek, viewingThisWeekTimes,
    viewingGrowth: numeric("viewingGrowth"), viewingTrend: trend.length === 4 ? trend : defaultReport.viewingTrend,
    prospectiveBuyers,
    marketLow: numeric("marketLow"), marketMedian: numeric("marketMedian"),
    marketHigh: numeric("marketHigh"), listingPrice: numeric("listingPrice"), averagePingPrice: numeric("averagePingPrice"),
    recentTransactions: numeric("recentTransactions"), marketSummary: text("marketSummary", 800),
    comparableCases: text("comparableCases", 1600),
    view591Count: numeric("view591Desktop") + numeric("view591Mobile"),
    view591Desktop: numeric("view591Desktop"), view591Mobile: numeric("view591Mobile"),
    view591Growth: numeric("view591Growth"), last591Sync: text("last591Sync", 80),
    analysisHeadline: text("analysisHeadline", 300), analysisBody: text("analysisBody", 3000), recommendation: text("recommendation", 1800),
    agentName: text("agentName", 40), agentTitle: text("agentTitle", 80), agentPhone: text("agentPhone", 40),
    announcementEnabled: value.announcementEnabled === true,
    announcements,
    negotiationRecords,
    conveyancingProcess,
    terminationNotice,
    updatedAt: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "請先登入管理帳號" }, { status: 401 });

  try {
    const previousReport = await getReport();
    const report = cleanReport(await request.json(), previousReport);
    const savedReport = await writeReport(report);
    const savedImages = new Set(savedReport.announcements.map((announcement) => announcement.imageUrl).filter(Boolean));
    await Promise.all(previousReport.announcements
      .map((announcement) => announcement.imageUrl)
      .filter((imageUrl) => imageUrl && !savedImages.has(imageUrl))
      .map((imageUrl) => removeAnnouncementImage(imageUrl).catch(() => undefined)));
    return Response.json({ report: savedReport });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "更新失敗" }, { status: 500 });
  }
}
