"use client";

// Better Auth 客户端（浏览器侧）
import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
