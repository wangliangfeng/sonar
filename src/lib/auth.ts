// Better Auth 配置（服务端）
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username({
      minUsernameLength: 2,
      maxUsernameLength: 30,
      // 账号名允许中文/字母/数字/下划线（默认只允许英文数字下划线）
      usernameValidator: (username) => /^[一-龥A-Za-z0-9_]+$/.test(username),
    }),
  ],
  // 部署为局域网 http（手机壳加载 http://192.168.10.25:3000），
  // 默认生产模式会发 __Secure-/Secure cookie，浏览器在 http 下拒绝保存 → 登录无法持久
  advanced: {
    useSecureCookies: false,
  },
  // 多主机访问（localhost / 局域网 IP / tailscale），无固定 baseURL，
  // 按请求 Host 动态放行同源 Origin，跨站请求仍被 CSRF 拦截
  trustedOrigins: async (request?: Request) => {
    const host = request?.headers.get("host");
    return host ? [`http://${host}`, `https://${host}`] : [];
  },
});
