import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getAdminUser } from "@/lib/admin";

export async function GET() {
  if (!(await getAdminUser())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
    .from(user)
    .orderBy(asc(user.createdAt));
  return NextResponse.json({ users: rows });
}
