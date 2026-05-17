# AI 輔助式錯題建檔與離線複習 APP 產品需求文件

> 版本：Free API Friendly MVP  
> 目的：提供給 Codex 開發 APP 使用  
> 核心限制：不使用付費 API，不設計大量即時 AI 呼叫  
> 核心理念：AI 只在「建檔階段」協助整理錯題，複習階段完全使用資料庫與程式邏輯完成  

---

## 1. 專案目標

本專案要開發一個「考卷錯誤題目紀錄與重新出題工具」。

使用者可以使用平板或手機拍照批改過的考卷或題目，系統透過 AI 協助辨識題目內容、分類科目、整理答案，並將原本的錯題轉換成選擇題或是非題後存入 Firebase 題庫。

當小朋友要考前總複習時，可以選擇科目或單元，系統會從資料庫中亂數抽出已建立的錯題，讓小朋友重新作答。作答後系統記錄答對、答錯、複習次數與熟練度，達到考前複習與弱點追蹤的目的。

本專案的核心不是「AI 即時家教」，而是：

> AI 輔助建檔，Firebase 儲存題庫，程式邏輯負責複習。

---

## 2. 重要開發限制

本專案明確限制如下：

1. 使用者不願意支付任何 API 費用。
2. AI 模型使用免費版本 Gemma / Google 免費 AI 資源。
3. AI 使用有額度限制，因此不可設計成大量即時呼叫。
4. 小朋友作答時不可每題即時呼叫 AI。
5. 題目複習、亂數出題、答題判斷、弱點統計必須全部由資料庫與前端 / 後端邏輯完成。
6. AI 只允許在「新增題目 / 建立題庫」時使用。
7. 每一題原則上只允許呼叫 AI 一次。
8. 所有 AI 產生結果都必須存入 Firebase，之後重複使用。
9. AI 解析結果必須提供家長確認與修改。
10. 第一版不追求完全自動化，優先追求穩定、可用、低成本。

---

## 3. 產品定位

本產品定位為：

> 免費額度友善型 AI 錯題複習工具

或正式名稱：

> AI 輔助式錯題建檔與離線複習系統

此工具不是要取代老師，也不是要做即時 AI 家教，而是協助家長將孩子以前錯過的題目整理成可重複練習的題庫。

---

## 4. 核心設計原則

```text
少用 AI，多用資料庫
一次解析，多次重用
先人工確認，再進題庫
複習階段完全不呼叫 AI
AI 是建檔助手，不是即時家教
```

系統架構上要遵守：

```text
AI = 建檔助手
Firebase = 題庫核心
程式邏輯 = 複習引擎
家長確認 = 品質保證
```

---

## 5. 使用者角色

### 5.1 家長

家長負責：

- 拍照上傳錯題
- 手動框選題目範圍
- 確認 AI 解析結果
- 修改題目、答案、選項、分類
- 查看小朋友弱點統計

### 5.2 小朋友

小朋友負責：

- 選擇科目
- 進行錯題複習
- 作答選擇題或是非題
- 查看答題結果
- 反覆練習錯題

---

## 6. MVP 功能範圍

### 6.1 MVP 必做功能

第一版必須完成以下功能：

1. 使用者登入
2. 建立小朋友資料
3. 拍照或上傳錯題圖片
4. 手動框選單題範圍
5. AI 一次性解析題目
6. AI 將題目轉成選擇題或是非題
7. 家長確認 / 修改 AI 結果
8. 題目存入 Firebase
9. 題庫列表
10. 科目篩選
11. 單元篩選
12. 亂數出題
13. 小朋友作答
14. 自動判斷對錯
15. 記錄答題結果
16. 題目熟練度更新
17. 錯題優先複習
18. 簡單弱點統計

---

### 6.2 MVP 暫時不做功能

第一版先不要做以下功能：

1. 整張考卷自動切題
2. 整張考卷自動批改
3. 大量手寫辨識
4. AI 即時家教講解
5. 每次作答後即時呼叫 AI 分析
6. AI 自動生成大量類似題
7. AI 自動生成完整模擬考卷
8. 語音講解
9. 多人班級管理
10. 老師後台
11. 複雜學習曲線分析
12. 複雜排程與自動提醒

---

## 7. 建議技術架構

### 7.1 前端

建議選擇其中一種：

#### 方案 A：Flutter

優點：

- 適合 iPad、Android 平板、手機
- 可支援 Web
- 適合未來跨平台

#### 方案 B：Web App / PWA

優點：

- 開發最快
- 可在平板瀏覽器直接使用
- 不需要上架 App Store
- 適合 MVP 快速驗證

建議 MVP 優先使用：

> Web App / PWA 或 Flutter

若目標是最快丟給 Codex 開發，建議使用：

> React + TypeScript + Firebase

---

### 7.2 後端與資料庫

使用 Firebase：

- Firebase Authentication：使用者登入
- Firestore：儲存題目、作答紀錄、分類資料
- Firebase Storage：儲存題目照片
- Firebase Security Rules：限制資料只能由該使用者存取

---

### 7.3 AI 模型

AI 模型使用免費版本 Gemma / Google 免費 AI 資源。

AI 只使用於：

1. 新增題目時解析圖片或文字
2. 建議科目分類
3. 建議單元分類
4. 建議答案
5. 將題目轉換成選擇題 / 是非題
6. 產生一次性簡短解釋

AI 不使用於：

1. 小朋友作答過程
2. 題目亂數抽選
3. 答案比對
4. 熟練度計算
5. 弱點統計
6. 每次複習即時講解
7. 每次複習重新生成題目

---

## 8. 系統主要流程

### 8.1 家長新增錯題流程

```text
1. 家長登入系統
2. 選擇小朋友
3. 點選「新增錯題」
4. 拍照或上傳考卷圖片
5. 手動框選單一題目範圍
6. 選擇 AI 使用模式
7. AI 解析題目並回傳 JSON
8. 系統顯示 AI 解析結果
9. 家長確認或修改
10. 儲存題目到 Firebase
```

---

### 8.2 小朋友複習流程

```text
1. 小朋友進入複習模式
2. 選擇科目
3. 可選擇單元或全部單元
4. 系統從 Firebase 抽題
5. 顯示題目與選項
6. 小朋友作答
7. 系統比對正確答案
8. 顯示答對 / 答錯
9. 顯示已儲存的簡短解釋
10. 更新答題紀錄與熟練度
11. 進入下一題
```

注意：

> 小朋友複習流程中完全不可呼叫 AI。

---

## 9. AI 使用模式設計

系統需提供 AI 使用模式設定。

### 9.1 手動模式

完全不使用 AI。

使用者手動輸入：

- 題目
- 科目
- 單元
- 題型
- 選項
- 正確答案
- 解釋

適合免費額度用完時。

---

### 9.2 省額度模式

AI 只做最必要的事情：

1. 整理題目文字
2. 轉成選擇題或是非題
3. 產生簡短解釋

不做複雜分類，不做大量分析。

---

### 9.3 標準模式

AI 在建檔時一次完成：

1. OCR / 圖片理解
2. 科目分類
3. 單元分類
4. 題型判斷
5. 答案建議
6. 轉換成選擇題 / 是非題
7. 產生簡短解釋
8. 建議錯因

但仍然必須遵守：

> 一題只呼叫 AI 一次。

---

## 10. AI 呼叫策略

### 10.1 不可接受的做法

不要將 AI 分成多次呼叫：

```text
第 1 次：OCR
第 2 次：分類
第 3 次：答案分析
第 4 次：轉選擇題
第 5 次：產生解釋
```

這樣一題會消耗多次 AI 額度，不符合本專案原則。

---

### 10.2 正確做法

一題只呼叫 AI 一次，要求 AI 回傳完整 JSON。

AI 回傳格式範例：

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
    {
      "label": "A",
      "text": "4 顆"
    },
    {
      "label": "B",
      "text": "5 顆"
    },
    {
      "label": "C",
      "text": "6 顆"
    },
    {
      "label": "D",
      "text": "8 顆"
    }
  ],
  "correctAnswer": "C",
  "explanation": "先算總共有 3 × 12 = 36 顆，再平均分給 6 個人，36 ÷ 6 = 6，所以答案是 6 顆。",
  "errorReasonSuggestion": "題意理解錯",
  "difficulty": "easy",
  "confidence": 0.86,
  "needsUserReview": true
}
```

---

## 11. AI Prompt 設計需求

### 11.1 Prompt 目標

AI 必須做：

- 解析圖片或文字中的題目
- 判斷科目
- 判斷單元
- 轉成選擇題或是非題
- 建議正確答案
- 產生簡短解釋
- 回傳固定 JSON

---

### 11.2 Prompt 範例

```text
你是一個錯題整理助手，目標是協助家長將小朋友的錯題整理成可複習的題庫。

請分析使用者提供的題目圖片或題目文字，並完成以下任務：

1. 辨識題目內容。
2. 判斷科目，例如：數學、國語、英文、自然、社會。
3. 判斷單元與題型。
4. 如果原題不是選擇題，請轉換成選擇題或是非題。
5. 產生合理選項，選項不可過於明顯。
6. 建議正確答案。
7. 產生簡短解題說明。
8. 建議可能錯因。
9. 若你不確定，請將 confidence 設低，並將 needsUserReview 設為 true。
10. 僅回傳 JSON，不要輸出額外文字。

請使用以下 JSON 格式：

{
  "subject": "",
  "unit": "",
  "topic": "",
  "questionType": "",
  "originalQuestionText": "",
  "convertedQuestion": "",
  "answerType": "multiple_choice 或 true_false",
  "options": [
    {"label": "A", "text": ""},
    {"label": "B", "text": ""},
    {"label": "C", "text": ""},
    {"label": "D", "text": ""}
  ],
  "correctAnswer": "",
  "explanation": "",
  "errorReasonSuggestion": "",
  "difficulty": "easy / medium / hard",
  "confidence": 0.0,
  "needsUserReview": true
}
```

---

## 12. 題目資料庫設計

### 12.1 Firestore Collection 結構

```text
users
 └── {userId}
      ├── profile
      ├── children
      │    └── {childId}
      ├── questions
      │    └── {questionId}
      ├── attempts
      │    └── {attemptId}
      └── reviewSessions
           └── {sessionId}
```

---

### 12.2 children 資料結構

```json
{
  "childId": "child_001",
  "name": "小明",
  "grade": "小學三年級",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

### 12.3 questions 資料結構

```json
{
  "questionId": "q_001",
  "childId": "child_001",
  "subject": "數學",
  "unit": "分數",
  "topic": "分數應用題",
  "questionType": "應用題",
  "answerType": "multiple_choice",
  "originalImageUrl": "firebase_storage_url",
  "croppedImageUrl": "firebase_storage_url",
  "originalQuestionText": "小明有 3 包糖果，每包 12 顆，平均分給 6 個人，每人可以分到幾顆？",
  "convertedQuestion": "小明有 3 包糖果，每包 12 顆，平均分給 6 個人，每人可以分到幾顆？",
  "options": [
    {
      "label": "A",
      "text": "4 顆"
    },
    {
      "label": "B",
      "text": "5 顆"
    },
    {
      "label": "C",
      "text": "6 顆"
    },
    {
      "label": "D",
      "text": "8 顆"
    }
  ],
  "correctAnswer": "C",
  "explanation": "先算總共有 3 × 12 = 36 顆，再平均分給 6 個人，36 ÷ 6 = 6。",
  "errorReason": "題意理解錯",
  "difficulty": "easy",
  "sourceType": "photo",
  "aiProcessed": true,
  "aiProcessCount": 1,
  "aiModel": "gemma_free",
  "aiConfidence": 0.86,
  "isUserConfirmed": true,
  "reviewStatus": "approved",
  "correctCount": 0,
  "wrongCount": 0,
  "totalAttemptCount": 0,
  "masteryLevel": 0,
  "lastReviewedAt": null,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

### 12.4 attempts 資料結構

```json
{
  "attemptId": "a_001",
  "questionId": "q_001",
  "childId": "child_001",
  "selectedAnswer": "C",
  "correctAnswer": "C",
  "isCorrect": true,
  "timeSpentSeconds": 18,
  "attemptedAt": "timestamp",
  "reviewSessionId": "session_001"
}
```

---

### 12.5 reviewSessions 資料結構

```json
{
  "sessionId": "session_001",
  "childId": "child_001",
  "subject": "數學",
  "unit": "全部",
  "questionCount": 10,
  "correctCount": 8,
  "wrongCount": 2,
  "startedAt": "timestamp",
  "endedAt": "timestamp"
}
```

---

## 13. 題目狀態設計

每一題必須有狀態欄位。

```text
pending_review：AI 已解析，等待家長確認
approved：家長已確認，可進入複習
needs_manual_edit：需要人工修正
rejected：不採用
archived：封存
```

只有 `approved` 的題目可以出現在小朋友複習中。

---

## 14. 熟練度設計

每題有 `masteryLevel`，範圍 0～5。

```text
0：尚未練習
1：答錯或非常不熟
2：答對但不穩
3：基本掌握
4：連續答對
5：已熟練
```

### 14.1 熟練度更新規則

```text
答對一次：masteryLevel + 1
答錯一次：masteryLevel - 1
masteryLevel 最低為 0
masteryLevel 最高為 5
連續答錯 2 次：標記為高風險題
連續答對 2 次：標記為基本掌握
masteryLevel = 5：降低出題頻率
```

---

## 15. 出題邏輯

### 15.1 基本出題條件

小朋友可選擇：

- 科目
- 單元
- 題數
- 是否優先錯題
- 是否排除已熟練題目

---

### 15.2 隨機出題規則

不要完全平均亂數，建議加權抽題。

優先順序：

1. masteryLevel 較低的題目
2. wrongCount 較高的題目
3. 最近答錯的題目
4. 很久沒複習的題目
5. 尚未練習的題目

---

### 15.3 加權抽題邏輯範例

```text
題目分數 = 
(5 - masteryLevel) * 3
+ wrongCount * 2
+ daysSinceLastReviewed * 0.2
```

分數越高，越優先出題。

---

## 16. 畫面設計需求

### 16.1 登入頁

功能：

- Email 登入
- Google 登入，選做
- 建立帳號
- 忘記密碼

---

### 16.2 首頁 Dashboard

顯示：

- 今日建議複習題數
- 已建立題目數
- 本週練習題數
- 本週正確率
- 最弱科目 / 單元
- 開始複習按鈕
- 新增錯題按鈕

---

### 16.3 新增錯題頁

功能：

- 拍照
- 從相簿上傳
- 手動輸入題目
- 手動框選題目區域
- 選擇 AI 使用模式

---

### 16.4 AI 解析確認頁

顯示：

- 原始圖片
- 裁切後圖片
- AI 辨識題目
- 科目
- 單元
- 題型
- AI 轉換後題目
- 選項
- 正確答案
- 解釋
- AI 信心分數
- 家長修改欄位
- 儲存按鈕

此頁是 MVP 非常重要的頁面。

---

### 16.5 題庫頁

功能：

- 題目列表
- 科目篩選
- 單元篩選
- 狀態篩選
- 熟練度篩選
- 搜尋題目
- 編輯題目
- 刪除 / 封存題目

---

### 16.6 複習設定頁

小朋友開始複習前可設定：

- 科目
- 單元
- 題數
- 是否優先出錯題
- 是否排除已熟練題

---

### 16.7 作答頁

顯示：

- 題目
- 圖片，若需要
- A / B / C / D 選項
- 是非題選項
- 下一題按鈕
- 答題進度

---

### 16.8 答題結果頁

答題後顯示：

- 答對 / 答錯
- 正確答案
- 已儲存的解題說明
- 下一題
- 結束複習

注意：

> 此頁不呼叫 AI，只顯示建檔時已存入的 explanation。

---

### 16.9 弱點統計頁

顯示：

- 各科題目數
- 各科正確率
- 各單元錯題數
- 錯最多的單元
- 低熟練度題目清單
- 最近練習紀錄

此頁統計全部用 Firestore 資料計算，不呼叫 AI。

---

## 17. 免費 API 額度保護機制

系統必須設計 AI 使用保護。

### 17.1 AI 呼叫計數

每個使用者記錄：

```json
{
  "dailyAiCallCount": 0,
  "monthlyAiCallCount": 0,
  "lastAiCallAt": "timestamp"
}
```

---

### 17.2 每題 AI 呼叫限制

每題資料需記錄：

```json
{
  "aiProcessed": true,
  "aiProcessCount": 1
}
```

若 `aiProcessCount >= 1`，預設不可再次呼叫 AI，除非使用者明確點選「重新解析」。

---

### 17.3 AI 額度提示

若使用者要使用 AI，畫面需提示：

```text
本功能會消耗一次 AI 分析額度。
建議確認照片清楚後再送出。
```

---

### 17.4 額度用完 fallback

若 AI 額度用完，系統不可中斷。

要改成：

```text
AI 額度已用完，請改用手動輸入模式。
```

手動模式仍可新增題目。

---

## 18. 錯因分類建議

錯因分類第一版可以簡化成下拉選單。

### 18.1 通用錯因

```text
粗心
題意理解錯
觀念不清楚
計算錯誤
公式不熟
單位換算錯
單字不熟
文法不熟
閱讀理解錯
其他
```

---

### 18.2 數學錯因

```text
計算錯誤
公式不熟
單位換算錯
題意理解錯
漏看條件
粗心
觀念不清
```

---

### 18.3 英文錯因

```text
單字不熟
文法不熟
時態錯誤
介系詞錯誤
閱讀理解錯
題幹翻譯錯
```

---

### 18.4 國文錯因

```text
字詞理解錯
閱讀理解錯
成語不熟
文意判斷錯
題幹關鍵字漏看
```

---

## 19. 開發優先順序

### Phase 1：基礎題庫功能

目標：不使用 AI 也能建立題庫。

功能：

1. 登入
2. 建立小朋友
3. 手動新增題目
4. 手動輸入選項與答案
5. 題庫列表
6. 科目篩選
7. 亂數出題
8. 作答紀錄

---

### Phase 2：加入 AI 建檔助手

目標：AI 只在新增題目時使用。

功能：

1. 拍照上傳
2. 圖片裁切
3. AI 一次性解析
4. AI JSON 回傳
5. 家長確認頁
6. 儲存 AI 結果

---

### Phase 3：複習強化

目標：讓錯題真正變成可追蹤複習系統。

功能：

1. 熟練度
2. 錯題優先
3. 加權抽題
4. 弱點統計
5. 複習紀錄

---

### Phase 4：進階功能，未來選做

這些功能先不做，未來如果 AI 額度足夠再考慮：

1. 類似題生成
2. 變形題生成
3. 模擬考生成
4. AI 個人化講解
5. 語音講解
6. 老師模式

---

## 20. 重要品質要求

### 20.1 AI 結果不可直接進正式題庫

AI 解析結果必須先進入：

```text
pending_review
```

家長確認後才能變成：

```text
approved
```

---

### 20.2 正確答案必須由家長確認

資料庫必須區分：

```json
{
  "aiSuggestedAnswer": "C",
  "confirmedAnswer": "C",
  "isUserConfirmed": true
}
```

小朋友作答時，只能使用 `confirmedAnswer` 判斷對錯。

---

### 20.3 低信心題目必須提醒

若 AI confidence < 0.75，系統要顯示：

```text
AI 對此題解析信心較低，請務必確認題目與答案。
```

---

## 21. 安全與隱私

### 21.1 基本原則

- 每個使用者只能讀寫自己的資料
- 小朋友資料不可公開
- 題目圖片不可公開
- Firestore 必須設定 Security Rules
- Storage 必須限制使用者只能存取自己的圖片

---

### 21.2 建議 Storage 路徑

```text
users/{userId}/children/{childId}/questions/{questionId}/original.jpg
users/{userId}/children/{childId}/questions/{questionId}/cropped.jpg
```

---

## 22. Firebase Security Rules 概念

實際 rules 可後續由 Codex 產生，但原則如下：

```text
使用者只能存取 users/{userId} 底下自己的資料。
request.auth.uid 必須等於 userId。
未登入不可讀寫任何資料。
```

---

## 23. 非功能需求

### 23.1 效能

- 題庫列表載入時間小於 2 秒
- 作答頁切換題目小於 1 秒
- 圖片上傳需要顯示進度
- AI 分析需要顯示 loading 狀態

### 23.2 使用體驗

- 平板操作優先
- 按鈕要大
- 小朋友作答畫面要簡單
- 家長確認頁要清楚
- 不要讓小朋友看到複雜設定

### 23.3 穩定性

- AI 失敗時不可讓整個流程中斷
- AI 額度用完時仍可手動新增題目
- Firestore 寫入失敗要提示
- 圖片上傳失敗要可重試

---

## 24. MVP 驗收標準

第一版完成後，需達成以下驗收條件：

1. 使用者可以登入。
2. 使用者可以建立至少一位小朋友。
3. 使用者可以手動新增一題選擇題。
4. 使用者可以拍照上傳一題錯題。
5. 使用者可以手動框選題目區域。
6. 系統可以呼叫 AI 解析該題。
7. AI 回傳結果可以顯示在確認頁。
8. 家長可以修改 AI 解析結果。
9. 題目可以儲存進 Firebase。
10. 小朋友可以選擇科目開始複習。
11. 系統可以亂數抽出題目。
12. 小朋友可以選擇答案。
13. 系統可以判斷答對或答錯。
14. 系統可以記錄作答紀錄。
15. 系統可以更新 correctCount、wrongCount、masteryLevel。
16. 系統可以顯示簡單弱點統計。
17. 小朋友作答流程中不會呼叫 AI。

---

## 25. 建議給 Codex 的開發指示

請依照以下優先順序開發：

```text
請先完成不依賴 AI 的基本題庫與複習系統。
完成後再加入 AI 建檔助手。
不要先開發 AI 即時講解、類似題生成、模擬考生成。
所有 AI 分析結果都必須儲存到 Firestore，複習時不得重新呼叫 AI。
```

---

## 26. 最終產品一句話

本 APP 是一個：

> 使用 AI 協助家長將錯題整理成可複習題庫，並讓小朋友在不消耗 AI 額度的情況下，透過 Firebase 題庫進行亂數複習與弱點追蹤的免費版錯題重練系統。

---

## 27. 開發備註

本專案最重要的成功條件不是 AI 多強，而是：

1. 題目建檔流程夠順。
2. 家長確認流程夠清楚。
3. 題庫資料結構正確。
4. 小朋友複習流程簡單。
5. AI 使用次數受到嚴格控制。
6. 即使 AI 不可用，系統仍可使用。

---

## 28. 不可違反的硬性規則

```text
1. 不可在小朋友作答時呼叫 AI。
2. 不可每次複習重新產生題目。
3. 不可把 AI 建議答案直接當正式答案。
4. 不可讓 pending_review 題目進入複習。
5. 不可讓一題預設呼叫 AI 多次。
6. 不可在 AI 額度用完時阻止使用者新增題目。
7. 不可將整張考卷全自動解析列為 MVP 必做。
8. 不可將類似題生成列為 MVP 必做。
9. 不可將 AI 家教聊天列為 MVP 必做。
10. 不可設計任何需要付費 API 才能運作的核心流程。
```

---

## 29. 推薦專案名稱

可選名稱：

```text
AI 錯題寶
錯題再練王
錯題重練系統
AI Mistake Review
Kid Review AI
Smart Wrong Question Bank
```

正式工程名稱建議：

```text
free-ai-mistake-review-app
```

---

## 30. 總結

本免費版設計將原本的大概念完整保留：

```text
拍照錯題
AI 整理
分類建檔
轉成選擇題 / 是非題
Firebase 題庫
小朋友亂數複習
答題紀錄
弱點統計
考前總複習
```

但同時移除或延後所有高 API 消耗功能：

```text
即時 AI 講解
大量類似題生成
整張考卷自動解析
自動模擬考生成
AI 家教聊天
每題作答後即時分析
```

因此這是一個適合免費 AI 額度限制下開發的 MVP 版本。

