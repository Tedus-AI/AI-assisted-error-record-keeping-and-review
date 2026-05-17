下面這段可以**直接複製貼到 Codex**，讓它開始開發。Codex Web 可連接 GitHub repo，並能在雲端環境讀取、修改與執行程式碼；OpenAI 官方也說 Codex 可協助撰寫功能、修 bug、理解 codebase、提出 PR。([OpenAI 開發者][1])

````markdown
# 任務：開發「AI 輔助式錯題建檔與離線複習 APP」MVP

你是一位資深 Full-stack App Developer。請根據本需求開始建立一個可運行的 MVP 專案。

## 一、專案目標

請開發一個「免費 API 友善型 AI 錯題複習工具」。

此工具目標是讓家長可以把小朋友做錯的考卷題目拍照建檔，AI 只在建檔時協助整理題目，之後小朋友複習時完全不呼叫 AI，只從 Firebase 題庫中亂數抽題作答。

核心理念：

- AI 只負責建檔，不負責即時家教。
- AI 只在新增題目時使用一次。
- 複習、出題、答題判斷、弱點統計全部使用 Firebase 資料與程式邏輯完成。
- 即使 AI 額度用完，系統仍然可以用手動模式新增題目。

## 二、技術棧要求

請使用以下技術：

- Frontend：React + TypeScript
- Build Tool：Vite
- UI：Tailwind CSS
- Backend / Database：Firebase
  - Firebase Authentication
  - Firestore
  - Firebase Storage
- 狀態管理：React hooks 即可，MVP 不需要 Redux
- Routing：React Router
- AI：先建立抽象服務層 `aiService.ts`
  - 第一版可以先用 mock AI response
  - 未來再接 Gemma / Google 免費 AI 資源
- 部署目標：Web App / PWA 優先

## 三、重要限制，必須遵守

請嚴格遵守：

1. 不可在小朋友作答時呼叫 AI。
2. 不可每次複習重新產生題目。
3. 不可把 AI 建議答案直接當正式答案。
4. AI 解析結果必須先進入 `pending_review`。
5. 只有家長確認後的 `approved` 題目才可以進入複習。
6. 每一題預設最多只允許 AI 分析一次。
7. 額度用完時必須可以改用手動新增題目。
8. 不要把「整張考卷自動解析」列為 MVP。
9. 不要開發 AI 家教聊天。
10. 不要開發大量類似題生成。
11. 不要開發自動模擬考生成。
12. MVP 必須先完成「不依賴 AI 也能運作」的題庫與複習流程。

## 四、MVP 必做功能

請依照以下順序開發。

### Phase 1：基礎題庫與複習系統

先完成不依賴 AI 的功能：

1. 使用者登入 / 登出
2. 建立小朋友資料
3. 手動新增題目
4. 手動輸入：
   - 科目
   - 單元
   - 題目
   - 選項
   - 正確答案
   - 解題說明
   - 錯因
5. 題庫列表
6. 題目編輯
7. 題目刪除 / 封存
8. 科目篩選
9. 單元篩選
10. 開始複習
11. 系統從 Firestore 抽出 `approved` 題目
12. 小朋友作答
13. 系統比對答案
14. 記錄答對 / 答錯
15. 更新熟練度 `masteryLevel`
16. 顯示簡單弱點統計

### Phase 2：AI 建檔助手

完成 Phase 1 後，再加入 AI 輔助功能：

1. 拍照或上傳題目圖片
2. 儲存圖片到 Firebase Storage
3. 手動框選題目範圍，MVP 可先做簡化版：
   - 先允許上傳單題圖片
   - 不一定要第一版完成複雜裁切
4. 呼叫 `aiService.analyzeQuestion()`
5. AI 回傳固定 JSON
6. 顯示 AI 解析確認頁
7. 家長可修改 AI 結果
8. 家長確認後存入 Firestore，狀態改為 `approved`

## 五、主要頁面

請建立以下頁面：

### 1. LoginPage

功能：

- Email / Password 登入
- Email / Password 註冊
- 登出功能

### 2. DashboardPage

顯示：

- 已建立題目數
- 本週練習題數
- 總正確率
- 最弱科目或單元
- 「新增錯題」按鈕
- 「開始複習」按鈕
- 「題庫管理」按鈕

### 3. ChildrenPage

功能：

- 建立小朋友
- 選擇目前小朋友
- 顯示小朋友清單

### 4. AddQuestionPage

支援兩種模式：

#### A. 手動模式

使用者手動輸入：

- subject
- unit
- topic
- questionType
- answerType
- convertedQuestion
- options
- correctAnswer
- explanation
- errorReason
- difficulty

儲存後狀態直接為 `approved`。

#### B. AI 輔助模式

使用者上傳圖片後，呼叫 mock AI service，產生解析結果，進入確認頁。

### 5. ReviewAIResultPage

顯示並允許修改 AI 結果：

- 原始圖片
- AI 辨識題目
- 科目
- 單元
- 題型
- 選項
- 正確答案
- 解題說明
- 錯因
- AI confidence
- 儲存並核准按鈕

注意：

AI 結果預設為 `pending_review`，按下確認後才變成 `approved`。

### 6. QuestionBankPage

功能：

- 題目列表
- 科目篩選
- 單元篩選
- 狀態篩選
- 熟練度篩選
- 編輯題目
- 封存題目
- 刪除題目

### 7. PracticeSetupPage

功能：

讓小朋友或家長選擇：

- 科目
- 單元
- 題數
- 是否優先出錯題
- 是否排除 masteryLevel = 5 的題目

### 8. PracticePage

功能：

- 顯示題目
- 顯示選項
- 小朋友作答
- 系統比對答案
- 顯示答對 / 答錯
- 顯示已儲存 explanation
- 下一題
- 結束複習

重要：

此頁不可呼叫 AI。

### 9. StatsPage

顯示：

- 各科題目數
- 各科正確率
- 各單元錯題數
- 低熟練度題目清單
- 最近練習紀錄

## 六、Firestore 資料結構

請使用以下結構。

```text
users
 └── {userId}
      ├── children
      │    └── {childId}
      ├── questions
      │    └── {questionId}
      ├── attempts
      │    └── {attemptId}
      └── reviewSessions
           └── {sessionId}
````

## 七、TypeScript 型別

請建立 `src/types/index.ts`。

```ts
export type QuestionStatus =
  | "pending_review"
  | "approved"
  | "needs_manual_edit"
  | "rejected"
  | "archived";

export type AnswerType = "multiple_choice" | "true_false";

export type Difficulty = "easy" | "medium" | "hard";

export interface Child {
  id: string;
  name: string;
  grade?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  childId: string;
  subject: string;
  unit: string;
  topic?: string;
  questionType: string;
  answerType: AnswerType;
  originalImageUrl?: string;
  croppedImageUrl?: string;
  originalQuestionText?: string;
  convertedQuestion: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  errorReason?: string;
  difficulty: Difficulty;
  sourceType: "manual" | "photo" | "ai";
  aiProcessed: boolean;
  aiProcessCount: number;
  aiModel?: string;
  aiConfidence?: number;
  isUserConfirmed: boolean;
  reviewStatus: QuestionStatus;
  correctCount: number;
  wrongCount: number;
  totalAttemptCount: number;
  masteryLevel: number;
  lastReviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attempt {
  id: string;
  questionId: string;
  childId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  attemptedAt: string;
  reviewSessionId?: string;
}

export interface ReviewSession {
  id: string;
  childId: string;
  subject?: string;
  unit?: string;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  startedAt: string;
  endedAt?: string;
}
```

## 八、AI Service 設計

請建立：

```text
src/services/aiService.ts
```

第一版先使用 mock，不要真的串 API。

```ts
export interface AIQuestionAnalysisResult {
  subject: string;
  unit: string;
  topic: string;
  questionType: string;
  originalQuestionText: string;
  convertedQuestion: string;
  answerType: "multiple_choice" | "true_false";
  options: {
    label: string;
    text: string;
  }[];
  correctAnswer: string;
  explanation: string;
  errorReasonSuggestion: string;
  difficulty: "easy" | "medium" | "hard";
  confidence: number;
  needsUserReview: boolean;
}

export async function analyzeQuestion(input: {
  imageUrl?: string;
  text?: string;
}): Promise<AIQuestionAnalysisResult> {
  // MVP: return mock data
  // Future: connect Gemma / Google free AI service here
}
```

Mock 回傳範例：

```json
{
  "subject": "數學",
  "unit": "分數",
  "topic": "分數應用題",
  "questionType": "應用題",
  "originalQuestionText": "小明有 3 包糖果，每包 12 顆，平均分給 6 個人，每人可以分到幾顆？",
  "convertedQuestion": "小明有 3 包糖果，每包 12 顆，平均分給 6 個人，每人可以分到幾顆？",
  "answerType": "multiple_choice",
  "options": [
    { "label": "A", "text": "4 顆" },
    { "label": "B", "text": "5 顆" },
    { "label": "C", "text": "6 顆" },
    { "label": "D", "text": "8 顆" }
  ],
  "correctAnswer": "C",
  "explanation": "先算總共有 3 × 12 = 36 顆，再平均分給 6 個人，36 ÷ 6 = 6。",
  "errorReasonSuggestion": "題意理解錯",
  "difficulty": "easy",
  "confidence": 0.86,
  "needsUserReview": true
}
```

## 九、熟練度更新邏輯

請建立 utility function：

```text
src/utils/mastery.ts
```

規則：

```text
答對：masteryLevel + 1
答錯：masteryLevel - 1
最低：0
最高：5
```

範例：

```ts
export function calculateNextMasteryLevel(
  currentLevel: number,
  isCorrect: boolean
): number {
  if (isCorrect) return Math.min(5, currentLevel + 1);
  return Math.max(0, currentLevel - 1);
}
```

## 十、出題邏輯

請建立：

```text
src/utils/questionPicker.ts
```

只允許從 `reviewStatus === "approved"` 的題目抽題。

加權分數：

```text
score =
(5 - masteryLevel) * 3
+ wrongCount * 2
+ daysSinceLastReviewed * 0.2
```

需求：

* masteryLevel 越低越優先
* wrongCount 越高越優先
* 越久沒複習越優先
* 若使用者選擇排除已熟練題目，排除 masteryLevel = 5
* 題數不足時，回傳所有符合條件的題目

## 十一、Firebase Service

請建立：

```text
src/services/firebase.ts
src/services/questionService.ts
src/services/childService.ts
src/services/attemptService.ts
```

需要提供 functions：

### childService

```ts
createChild()
getChildren()
updateChild()
deleteChild()
```

### questionService

```ts
createQuestion()
getQuestions()
getApprovedQuestions()
updateQuestion()
archiveQuestion()
deleteQuestion()
```

### attemptService

```ts
createAttempt()
getAttemptsByChild()
getAttemptsByQuestion()
```

## 十二、UI 要求

請使用 Tailwind CSS。

設計方向：

* 平板優先
* 按鈕要大
* 小朋友作答頁要簡單
* 家長管理頁可以資訊較多
* Dashboard 使用卡片式設計
* 題目選項使用大按鈕
* 答對顯示鼓勵訊息
* 答錯顯示正確答案與 explanation

## 十三、Firebase 設定

請提供 `.env.example`：

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

請不要把實際 API key 寫死在程式中。

## 十四、Security Rules

請提供基本 Firestore rules 範本：

```text
使用者只能讀寫 users/{userId} 底下自己的資料。
request.auth.uid 必須等於 userId。
未登入不可讀寫。
```

請在專案中建立：

```text
firestore.rules
storage.rules
```

## 十五、開發完成後請提供

請完成後回報：

1. 專案目錄結構
2. 已完成哪些功能
3. 如何安裝與啟動
4. 需要設定哪些 Firebase 環境變數
5. 尚未完成或建議下一步
6. 是否有需要我手動建立 Firebase project / Firestore / Storage

## 十六、驗收條件

完成後至少要能做到：

1. 可以登入或註冊。
2. 可以建立小朋友。
3. 可以手動新增一題選擇題。
4. 可以在題庫看到該題。
5. 可以開始複習。
6. 可以作答。
7. 可以判斷對錯。
8. 可以寫入 attempt。
9. 可以更新 masteryLevel。
10. 可以顯示簡單統計。
11. 可以上傳圖片並取得 mock AI 解析結果。
12. AI 解析結果需要家長確認後才可進入複習。
13. 小朋友作答流程完全不呼叫 AI。

請現在開始建立專案並實作 Phase 1，再實作 Phase 2 的 mock AI 建檔助手。

```
::contentReference[oaicite:1]{index=1}
```

[1]: https://developers.openai.com/codex/cloud?utm_source=chatgpt.com "Codex web"
