// 管理后台鉴权：读取当前登录用户（未登录返回 null）
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getAdminUser(): Promise<{ id: string; name: string; email: string } | null> {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    return session?.user
      ? { id: session.user.id, name: session.user.name, email: session.user.email }
      : null;
  } catch {
    return null;
  }
}
