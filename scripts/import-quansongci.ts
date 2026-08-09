// 一次性导入《全宋词》EPUB 到 guji_books
// 用法：node scripts/import-quansongci.ts [epub路径]
import { readFileSync } from "fs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { gujiBooks } from "../src/db/schema";
import { parseEpub } from "../src/lib/gujiParse";

const epubPath =
  process.argv[2] || "D:/Download2026/全宋词 (多人) (z-library.sk, 1lib.sk, z-lib.sk).epub";

async function main() {
  const existing = await db
    .select({ id: gujiBooks.id })
    .from(gujiBooks)
    .where(eq(gujiBooks.title, "全宋词"))
    .limit(1);
  if (existing.length) {
    console.log("《全宋词》已存在，跳过（如需重导请先删除）");
    return;
  }
  const buf = readFileSync(epubPath);
  const entries = parseEpub(new Uint8Array(buf));
  // 合并同名作者（辛弃疾等分两章）、佚名归并
  const byName = new Map<string, string[]>();
  for (const e of entries) {
    const name = e.name === "xxx" ? "佚名" : e.name;
    if (!name) continue;
    const arr = byName.get(name) ?? [];
    arr.push(...e.lines);
    byName.set(name, arr);
  }
  const merged = [...byName.entries()]
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh"));

  await db.insert(gujiBooks).values({
    title: "全宋词",
    author: "唐圭璋 编",
    dynasty: "宋",
    intro:
      "《全宋词》为唐圭璋编纂的宋词总集，收录两宋词人 1300 余家、词作近两万首。本库为按词人组织的电子文本，可在书内搜索词人、词牌或词句。",
    data: JSON.stringify(merged),
  });
  console.log(
    `已导入《全宋词》：${merged.length} 位词人，${merged.reduce((s, e) => s + e.lines.length, 0)} 行`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
