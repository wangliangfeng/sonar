import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { AdminPanel } from "@/components/admin/AdminPanel";

// 管理后台：需登录
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");
  return <AdminPanel user={user.name || user.email} />;
}
