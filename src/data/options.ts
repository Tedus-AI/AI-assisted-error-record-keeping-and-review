export const subjectOptions = ["數學", "國語", "英文", "自然", "社會"];

export const gradeOptions = [
  "幼兒園大班",
  "小學一年級",
  "小學二年級",
  "小學三年級",
  "小學四年級",
  "小學五年級",
  "小學六年級",
  "國中一年級",
];

export const errorReasonOptions = [
  "粗心",
  "題意理解錯",
  "觀念不清楚",
  "觀念不清",
  "計算錯誤",
  "進位漏算",
  "公式不熟",
  "單位換算錯",
  "分數乘除概念混淆",
  "字詞理解錯",
  "單字不熟",
  "文法不熟",
  "閱讀理解錯",
  "其他",
];

export const difficultyOptions = [
  { value: "easy", label: "簡單" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困難" },
] as const;
