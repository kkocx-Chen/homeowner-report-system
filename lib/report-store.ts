import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { defaultReport, isViewingOnOrAfterHistoryStart, type Announcement, type PropertyReport } from "./report";

type LegacyAnnouncement = Partial<Omit<Announcement, "id" | "publishedAt">>;
type StoredReport = Partial<PropertyReport> & { announcement?: LegacyAnnouncement };

function dataPaths() {
  return {
    directory: "data",
    report: "data/report.json",
    temporary: "data/report.tmp.json",
  };
}

export async function getReport(): Promise<PropertyReport> {
  const files = dataPaths();
  try {
    const saved = JSON.parse(await readFile(files.report, "utf8")) as StoredReport;
    const legacyAnnouncement = saved.announcement && typeof saved.announcement === "object" ? saved.announcement : null;
    const migratedLegacyAnnouncement: Announcement[] = legacyAnnouncement && (
      legacyAnnouncement.enabled || legacyAnnouncement.title || legacyAnnouncement.body || legacyAnnouncement.imageUrl
    ) ? [{
      id: "legacy-announcement",
      enabled: legacyAnnouncement.enabled === true,
      title: String(legacyAnnouncement.title ?? ""),
      body: String(legacyAnnouncement.body ?? ""),
      imageUrl: String(legacyAnnouncement.imageUrl ?? ""),
      publishedAt: typeof saved.updatedAt === "string" ? saved.updatedAt : defaultReport.updatedAt,
    }] : [];
    const announcements = Array.isArray(saved.announcements) ? saved.announcements : migratedLegacyAnnouncement;
    const hasViewingHistory = Array.isArray(saved.viewingTimes);
    const viewingTimes = hasViewingHistory
      ? saved.viewingTimes!
        .map((value) => String(value ?? ""))
        .filter((value) => !value.trim() || isViewingOnOrAfterHistoryStart(value))
      : (Array.isArray(saved.viewingThisWeekTimes) ? saved.viewingThisWeekTimes : [])
        .map((value) => String(value ?? ""))
        .filter(isViewingOnOrAfterHistoryStart);
    const savedReport = { ...saved };
    delete savedReport.announcement;
    return {
      ...defaultReport,
      ...savedReport,
      viewingCount: viewingTimes.length,
      viewingTimes,
      announcementEnabled: typeof saved.announcementEnabled === "boolean"
        ? saved.announcementEnabled
        : legacyAnnouncement?.enabled === true,
      announcements,
    } as PropertyReport;
  } catch {
    await mkdir(files.directory, { recursive: true });
    await writeFile(files.report, JSON.stringify(defaultReport, null, 2), "utf8");
    return defaultReport;
  }
}

export async function writeReport(report: PropertyReport): Promise<PropertyReport> {
  const files = dataPaths();
  const updated = { ...report, updatedAt: new Date().toISOString() };
  await mkdir(files.directory, { recursive: true });
  await writeFile(files.temporary, JSON.stringify(updated, null, 2), "utf8");
  await rename(files.temporary, files.report);
  return updated;
}
