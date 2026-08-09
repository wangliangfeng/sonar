import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { getAdminUser } from "@/lib/admin";

export async function GET() {
  if (!(await getAdminUser())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const rows = await db.select().from(downloads).orderBy(desc(downloads.createdAt)).limit(30);
  return NextResponse.json({ downloads: rows });
}
