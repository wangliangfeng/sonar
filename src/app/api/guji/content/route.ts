import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gujiBooks } from "@/db/schema";

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  const rows = await db
    .select({ data: gujiBooks.data })
    .from(gujiBooks)
    .where(eq(gujiBooks.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "不存在" }, { status: 404 });
  return NextResponse.json(JSON.parse(row.data));
}
