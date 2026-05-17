# AI 錯題寶

AI 輔助式錯題建檔與離線複習 Web App MVP。

本專案依照 PRD 實作「AI 只在建檔時使用，複習時完全不呼叫 AI」的流程。未設定 Firebase 時會使用瀏覽器 localStorage demo 資料，方便先在 iPad 或桌面瀏覽器試用；填入 Firebase `.env` 後可接 Firebase Authentication、Firestore 與 Storage。

## 已完成

- React + TypeScript + Vite + Tailwind CSS
- PWA manifest、iOS/iPad viewport 與大尺寸觸控 UI
- 手繪筆記本風格 UI，參考 `PIC` 內設計圖
- Email 登入/註冊介面與 demo 登入
- 小朋友資料管理
- 手動新增錯題，儲存後直接 `approved`
- mock AI 建檔助手，AI 結果先進 `pending_review`
- AI 解析確認頁，家長確認後才可存入題庫
- 題庫管理、篩選、編輯、封存、刪除
- 複習設定與加權抽題
- 作答頁、答案比對、attempt 記錄、masteryLevel 更新
- 弱點統計與最近練習紀錄
- Firestore / Storage security rules 範本

## 啟動

```bash
npm install
npm run dev
```

開啟：

```text
http://localhost:5173/
```

建置：

```bash
npm run build
```

## Firebase 環境變數

複製 `.env.example` 為 `.env`，填入：

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

未填入時，系統會使用本機 demo 儲存，不會阻擋 MVP 試用。

## 重要限制

- 小朋友作答流程不呼叫 AI。
- 複習只抽 `reviewStatus === "approved"` 的題目。
- mock AI 每次解析會累計 AI 使用次數。
- AI 解析結果需家長確認後才會變成 `approved`。
- MVP 先保留圖片框選資訊，實際 Canvas 裁切可放到下一階段。

## 主要目錄

```text
src/
  components/      共用 UI 元件
  context/         App 狀態與資料操作
  data/            demo seed data 與選項
  hooks/           useAppData
  pages/           主要頁面
  services/        Firebase、local fallback、AI mock
  types/           TypeScript 型別
  utils/           熟練度、抽題、統計工具
```
