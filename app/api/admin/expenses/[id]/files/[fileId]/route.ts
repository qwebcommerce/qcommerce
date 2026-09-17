import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getExpenseById } from "@/lib/db";
import { fetchExpenseFile } from "@/lib/storage";

function contentDisposition(name: string, download: boolean) {
  const safe = name.replace(/[\r\n"]/g, "").slice(0, 180) || "file";
  const encoded = encodeURIComponent(safe);
  return `${download ? "attachment" : "inline"}; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  const session = await getAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { id, fileId } = await params;
  const expense = await getExpenseById(id);
  const file = expense?.files.find((item) => item.id === fileId);
  if (!expense || !file) return new Response("Not found", { status: 404 });
  try {
    const upstream = await fetchExpenseFile(file.path);
    const download = request.nextUrl.searchParams.get("download") === "1";
    const headers = new Headers();
    headers.set("Content-Type", file.type || upstream.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Content-Disposition", contentDisposition(file.name, download));
    headers.set("Cache-Control", "private, no-store");
    const length = upstream.headers.get("Content-Length");
    if (length) headers.set("Content-Length", length);
    return new Response(upstream.body, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
