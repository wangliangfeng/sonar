import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  json,
  longtext,
  mysqlTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const sources = mysqlTable(
  "sources",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    url: varchar("url", { length: 500 }).notNull(),
    // MySQL 5.7 索引键上限 1000 字节，utf8mb4 下唯一索引用固定长度 hash 列
    urlHash: varchar("url_hash", { length: 40 }).notNull(),
    category: varchar("category", { length: 40 }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => [uniqueIndex("sources_url_hash_idx").on(t.urlHash)],
);

export const articles = mysqlTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    sourceId: int("source_id").references(() => sources.id, { onDelete: "set null" }),
    title: varchar("title", { length: 600 }).notNull(),
    link: varchar("link", { length: 512 }).notNull(),
    linkHash: varchar("link_hash", { length: 40 }).notNull(),
    desc: text("desc"),
    author: varchar("author", { length: 150 }),
    category: varchar("category", { length: 40 }).notNull(),
    pubTs: timestamp("pub_ts"),
    // MySQL 5.7 不支持表达式默认值 DEFAULT (now())，必须用 CURRENT_TIMESTAMP
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("articles_link_hash_idx").on(t.linkHash),
    index("articles_cat_idx").on(t.category),
    index("articles_pub_idx").on(t.pubTs),
  ],
);

// 免版权音乐：搜索结果缓存（提速）+ 下载记录（落本地库）
export const royaltyCache = mysqlTable(
  "royalty_cache",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 64 }).notNull(),
    payload: json("payload"),
    ts: timestamp("ts").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("royalty_cache_key_idx").on(t.key)],
);

export const downloads = mysqlTable(
  "downloads",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    url: varchar("url", { length: 500 }).notNull(),
    filePath: varchar("file_path", { length: 500 }).notNull(),
    size: int("size"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("downloads_created_idx").on(t.createdAt)],
);

// 拌嘴 · 树洞：登录用户吐槽日常（类似豆瓣树洞）
export const banter = mysqlTable(
  "banter",
  {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userName: varchar("user_name", { length: 120 }).notNull(),
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("banter_created_idx").on(t.createdAt)],
);

export type BanterRow = typeof banter.$inferSelect;

// ============ Better Auth（登录注册）============
// 注意 MySQL 5.7：①索引键上限 1000 字节 → 唯一索引列(email/token)控制长度
// ②TIMESTAMP 可空列默认值会报错 → 一律用 datetime
export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 245 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // better-auth username 插件：账号名作为登录标识（可空以兼容历史邮箱用户）
  username: varchar("username", { length: 30 }).unique(),
  displayUsername: varchar("display_username", { length: 30 }),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const session = mysqlTable("session", {
  id: varchar("id", { length: 36 }).primaryKey(),
  expiresAt: datetime("expires_at").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = mysqlTable("account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: datetime("access_token_expires_at"),
  refreshTokenExpiresAt: datetime("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const verification = mysqlTable("verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 古籍：上传的文档入库，data 存解析后的 [{name, lines}] JSON（大书按词人/章节分条）
export const gujiBooks = mysqlTable("guji_books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 120 }).notNull(),
  dynasty: varchar("dynasty", { length: 40 }).notNull(),
  intro: text("intro"),
  data: longtext("data").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type GujiBookRow = typeof gujiBooks.$inferSelect;
export type NewGujiBook = typeof gujiBooks.$inferInsert;

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type RoyaltyCacheRow = typeof royaltyCache.$inferSelect;
export type DownloadRow = typeof downloads.$inferSelect;
