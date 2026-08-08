import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const imageDirectory = resolve(process.cwd(), "data", "uploads", "announcements");
const imageUrlPrefix = "/api/announcement-image/";
const imageNamePattern = /^announcement-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export const MAX_ANNOUNCEMENT_IMAGE_BYTES = 6 * 1024 * 1024;

type ImageFormat = {
  extension: "jpg" | "png" | "webp";
  contentType: "image/jpeg" | "image/png" | "image/webp";
};

function detectImageFormat(bytes: Buffer): ImageFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { extension: "png", contentType: "image/png" };
  }
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return { extension: "webp", contentType: "image/webp" };
  }
  return null;
}

function imagePath(filename: string) {
  return join(imageDirectory, filename);
}

export function filenameFromAnnouncementImageUrl(value: unknown) {
  if (typeof value !== "string" || !value.startsWith(imageUrlPrefix)) return null;
  const filename = value.slice(imageUrlPrefix.length);
  return imageNamePattern.test(filename) ? filename : null;
}

export function isAnnouncementImageUrl(value: unknown): value is string {
  return filenameFromAnnouncementImageUrl(value) !== null;
}

export async function saveAnnouncementImage(file: File) {
  if (file.size === 0) throw new Error("請選擇有效的公告照片。");
  if (file.size > MAX_ANNOUNCEMENT_IMAGE_BYTES) throw new Error("公告照片大小不可超過 6 MB。");

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_ANNOUNCEMENT_IMAGE_BYTES) throw new Error("公告照片大小不可超過 6 MB。");

  const format = detectImageFormat(bytes);
  if (!format) throw new Error("僅支援 JPG、PNG 或 WebP 格式的公告照片。");

  const filename = `announcement-${randomUUID()}.${format.extension}`;
  const destination = imagePath(filename);
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await mkdir(imageDirectory, { recursive: true });
  await writeFile(temporary, bytes, { mode: 0o640 });
  await rename(temporary, destination);

  return { url: `${imageUrlPrefix}${filename}`, contentType: format.contentType };
}

export async function getAnnouncementImage(filename: string) {
  if (!imageNamePattern.test(filename)) return null;
  const extension = filename.split(".").at(-1);
  const contentType = extension === "jpg" ? "image/jpeg" : extension === "png" ? "image/png" : "image/webp";
  try {
    return { bytes: await readFile(imagePath(filename)), contentType };
  } catch {
    return null;
  }
}

export async function removeAnnouncementImage(value: unknown) {
  const filename = filenameFromAnnouncementImageUrl(value);
  if (!filename) return;
  try {
    await unlink(imagePath(filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
