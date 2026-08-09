// 日本文学双奖（芥川賞 / 直木賞）精选代表获奖，作者简介走 Wikidata
export interface LitWinner {
  year: string;
  title: string;
  author: string;
}

export interface LitAward {
  id: string;
  name: string;
  en: string;
  desc: string;
  officialUrl: string;
  winners: LitWinner[];
}

// 芥川賞：纯文学新人奖（1935 年创立，每期上半/下半年度）
export const AKUTAGAWA: LitAward = {
  id: "akutagawa",
  name: "芥川龍之介賞",
  en: "AKUTAGAWA PRIZE",
  desc: "日本最重要的纯文学新人奖 · 精选代表获奖",
  officialUrl: "https://www.bunshun.co.jp/",
  winners: [
    { year: "2024", title: "サンショウウオの四十九日", author: "朝比奈秋" },
    { year: "2024", title: "バリ山行", author: "松永K三蔵" },
    { year: "2023", title: "ハンチバック（驼背）", author: "市川沙央" },
    { year: "2023", title: "東京都同情塔", author: "九段理江" },
    { year: "2022", title: "おいしいごはんが食べられますように", author: "高瀬隼子" },
    { year: "2021", title: "彼岸花が咲く島", author: "李琴峰" },
    { year: "2021", title: "貝に続く場所にて", author: "石沢麻依" },
    { year: "2020", title: "推し、燃ゆ（推她，燃烧）", author: "宇佐見りん" },
    { year: "2020", title: "首里の馬", author: "高山羽根子" },
    { year: "2016", title: "コンビニ人間（便利店人间）", author: "村田沙耶香" },
    { year: "2004", title: "蛇にピアス（蛇信与舌环）", author: "金原ひとみ" },
    { year: "2004", title: "蹴りたい背中（欠踹的背影）", author: "綿矢りさ" },
    { year: "1999", title: "日蝕", author: "平野啓一郎" },
    { year: "1996", title: "蛇を踏む（踏蛇）", author: "川上弘美" },
    { year: "1991", title: "妊娠カレンダー（妊娠月历）", author: "小川洋子" },
    { year: "1976", title: "限りなく透明に近いブルー", author: "村上龍" },
    { year: "1958", title: "飼育（饲育）", author: "大江健三郎" },
    { year: "1955", title: "太陽の季節（太阳的季节）", author: "石原慎太郎" },
    { year: "1952", title: "『小倉日記』伝", author: "松本清張" },
    { year: "1951", title: "壁（墙壁）", author: "安部公房" },
    { year: "1935", title: "蒼氓", author: "石川達三" },
  ],
};

// 直木賞：大众小说奖（1935 年创立，面向已有实绩的作家）
export const NAOKI: LitAward = {
  id: "naoki",
  name: "直木三十五賞",
  en: "NAOKI PRIZE",
  desc: "日本最重要的大众小说奖 · 精选代表获奖",
  officialUrl: "https://www.bunshun.co.jp/",
  winners: [
    { year: "2022", title: "塞王の楯", author: "今村翔吾" },
    { year: "2019", title: "そして、バトンは渡された", author: "瀬尾まいこ" },
    { year: "2013", title: "ホテルローヤル", author: "桜木紫乃" },
    { year: "2012", title: "何者", author: "朝井リョウ" },
    { year: "2009", title: "哀悼人", author: "天童荒太" },
    { year: "2008", title: "利休にたずねよ", author: "山本兼一" },
    { year: "2006", title: "まほろ駅前多田便利軒", author: "三浦しをん" },
    { year: "2005", title: "容疑者Xの献身（嫌疑人X的献身）", author: "東野圭吾" },
    { year: "2003", title: "空中ブランコ", author: "奥田英朗" },
    { year: "1998", title: "理由", author: "宮部みゆき" },
    { year: "1967", title: "蒼ざめた馬を見よ", author: "五木寛之" },
    { year: "1959", title: "梟の城", author: "司馬遼太郎" },
  ],
};

export const JP_AWARDS: LitAward[] = [AKUTAGAWA, NAOKI];
