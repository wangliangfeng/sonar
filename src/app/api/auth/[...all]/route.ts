import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Better Auth 统一入口：/api/auth/*
export const { GET, POST } = toNextJsHandler(auth);
