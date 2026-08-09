import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "mysql://root:root@localhost:3306/sonar";

// 模块级共享连接池：服务端组件/路由处理器共用，避免每次请求新建连接
const pool = mysql.createPool(connectionString);

export const db = drizzle(pool, { schema, mode: "default" });
