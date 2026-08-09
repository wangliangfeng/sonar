// 音乐人 · 按国籍分类（精选收录）
export const NATIONS: string[] = ["中国", "日本", "美国", "英国", "韩国", "欧洲古典"];

export const MUSICIANS_BY_NATION: Record<string, string[]> = {
  中国: ["郎朗", "周杰伦", "谭盾", "李云迪", "龚琳娜", "宋祖英", "谭维维", "黄绮珊", "莫文蔚", "王菲"],
  日本: ["坂本龙一", "久石让", "中岛美雪", "玉置浩二", "米津玄师", "宇多田光", "椎名林檎", "小泽征尔"],
  美国: ["Taylor Swift", "Beyoncé", "Michael Jackson", "Lady Gaga", "Bruno Mars", "Billie Eilish", "Kendrick Lamar"],
  英国: ["The Beatles", "Adele", "Elton John", "David Bowie", "Coldplay", "Dua Lipa", "Ed Sheeran"],
  韩国: ["BTS", "BLACKPINK", "IU", "PSY", "BigBang", "NewJeans"],
  "欧洲古典": ["贝多芬", "莫扎特", "巴赫", "肖邦", "李斯特", "舒伯特", "柴可夫斯基", "德彪西"],
};
