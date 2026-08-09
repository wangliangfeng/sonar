import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { gujiBooks } from "@/db/schema";
import { getAdminUser } from "@/lib/admin";
import { parseUpload } from "@/lib/gujiParse";

const LIST_COLS = {
  id: gujiBooks.id,
  title: gujiBooks.title,
  author: gujiBooks.author,
  dynasty: gujiBooks.dynasty,
  intro: gujiBooks.intro,
  createdAt: gujiBooks.createdAt,
} as const;

export async function GET() {
  const rows = await db
    .select(LIST_COLS)
    .from(gujiBooks)
    .orderBy(desc(gujiBooks.id));
  return NextResponse.json({ books: rows });
}

export async function POST(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const fd = await req.formData();
  const title = String(fd.get("title") ?? "").trim();
  const author = String(fd.get("author") ?? "").trim();
  const dynasty = String(fd.get("dynasty") ?? "").trim();
  const intro = String(fd.get("intro") ?? "").trim();
  const file = fd.get("file");
  if (!title || !author || !dynasty) {
    return NextResponse.json({ error: "书名/作者/朝代必填" }, { status: 400 });
  }
  if (!file || typeof (file as File).arrayBuffer !== "function") {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }
  const buf = new Uint8Array(await (file as File).arrayBuffer());
  let entries;
  try {
    entries = parseUpload(buf, (file as File).name, title);
  } catch {
    return NextResponse.json({ error: "文件解析失败，请确认格式" }, { status: 400 });
  }
  if (entries.length === 0) {
    return NextResponse.json({ error: "未能从文件中解析出正文" }, { status: 400 });
  }
  await db.insert(gujiBooks).values({
    title,
    author,
    dynasty,
    intro: intro || null,
    data: JSON.stringify(entries),
  });
  return NextResponse.json({ ok: true, entries: entries.length });
}

export async function DELETE(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  await db.delete(gujiBooks).where(eq(gujiBooks.id, id));
  return NextResponse.json({ ok: true });
}
