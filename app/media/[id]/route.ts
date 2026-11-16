import { getImage } from "@/lib/images";

/**
 * DB에 저장된 이미지 보내기 (/media/<id>).
 * 이미지는 한 번 올리면 바뀌지 않으므로(바꾸면 새 id) 오래 캐시합니다.
 */
export async function GET(_request: Request, { params }: RouteContext<"/media/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response("Not found", { status: 404 });
  }

  const image = await getImage(id);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.data.length),
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
