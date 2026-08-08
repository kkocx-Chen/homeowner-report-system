import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { defaultReport, type PropertyReport } from "./report";

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
    const saved = JSON.parse(await readFile(files.report, "utf8")) as Partial<PropertyReport>;
    const savedAnnouncement = saved.announcement && typeof saved.announcement === "object" ? saved.announcement : {};
    return {
      ...defaultReport,
      ...saved,
      announcement: { ...defaultReport.announcement, ...savedAnnouncement },
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
