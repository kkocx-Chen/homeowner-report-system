import { isAdmin } from "../../../../lib/admin-auth";
import { MAX_ANNOUNCEMENT_IMAGE_BYTES, saveAnnouncementImage } from "../../../../lib/announcement-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "請先登入管理帳號" }, { status: 401 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_ANNOUNCEMENT_IMAGE_BYTES + 128 * 1024) {
    return Response.json({ error: "公告照片大小不可超過 6 MB。" }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!image || typeof image === "string") return Response.json({ error: "請選擇一張公告照片。" }, { status: 400 });
    return Response.json(await saveAnnouncementImage(image), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "照片上傳失敗，請稍後再試。" }, { status: 400 });
  }
}
