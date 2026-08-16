export const dynamic = "force-dynamic";

function isAllowedRequest(request: Request) {
  const origin = request.headers.get("origin");
  const requestHost = new URL(request.url).hostname;
  const isLocalProxyHost = requestHost === "127.0.0.1" || requestHost === "localhost";

  if (origin && !isLocalProxyHost) {
    try {
      if (new URL(origin).hostname !== requestHost) return false;
    } catch {
      return false;
    }
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none";
}

export async function POST(request: Request) {
  if (!isAllowedRequest(request)) {
    return Response.json({ error: "不允許此請求。" }, { status: 403 });
  }

  return Response.json({ ok: true, deprecated: true });
}
