import { getAnnouncementImage } from "../../../../lib/announcement-image";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  const image = await getAnnouncementImage(filename);
  if (!image) return new Response("找不到公告照片", { status: 404 });

  return new Response(image.bytes, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
