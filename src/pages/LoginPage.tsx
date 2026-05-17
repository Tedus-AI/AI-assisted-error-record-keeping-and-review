import { useEffect, useState } from "react";
import {
  ClipboardList,
  Database,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { HandCard } from "../components/HandCard";
import { useAppData } from "../hooks/useAppData";
import { isFirebaseConfigured } from "../services/firebase";

export function LoginPage() {
  const { user, loginGoogle, loginDemo } = useAppData();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [navigate, user]);

  const demo = async () => {
    await loginDemo();
    navigate("/", { replace: true });
  };

  const google = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await loginGoogle();
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google 登入失敗，請確認 Firebase 已啟用 Google 登入。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-[1360px] gap-6 lg:grid-cols-[1fr_520px] lg:items-center">
        <section className="relative overflow-hidden rounded-[28px] border-4 border-crayon-blue bg-[#fbf4e5] p-6 shadow-soft sm:p-10">
          <span className="tape left-7 top-5 bg-crayon-blue" aria-hidden="true" />
          <div className="mb-8">
            <Logo />
          </div>
          <h1 className="crayon-title max-w-2xl text-4xl leading-tight sm:text-6xl">
            AI 輔助建檔，離線
            <span className="crayon-underline text-crayon-blue">高效複習</span>
          </h1>
          <p className="mt-5 max-w-2xl text-xl font-bold leading-9 text-slate-700">
            把孩子的錯題整理成可重複練習的題庫。AI 只在建檔時幫忙，複習時完全使用已保存資料。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ClipboardList,
                title: "快速建檔",
                body: "拍照、上傳或手動輸入，題目資料一次整理好。",
              },
              {
                icon: Sparkles,
                title: "精準複習",
                body: "優先安排低熟練度與錯過的題目。",
              },
              {
                icon: ShieldCheck,
                title: "額度安心",
                body: "作答與統計不呼叫 AI，免費額度更耐用。",
              },
            ].map((item) => (
              <HandCard key={item.title} className="p-4" tone="blue">
                <item.icon className="mb-3 text-crayon-blue" size={32} />
                <h2 className="crayon-title text-xl">{item.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {item.body}
                </p>
              </HandCard>
            ))}
          </div>
      </section>

        <HandCard className="p-5 sm:p-7" tape>
          <h2 className="crayon-title text-center text-3xl">歡迎回來</h2>
          <p className="mt-2 text-center font-semibold text-slate-500">
            使用 Google 帳號登入後開始整理錯題與安排複習
          </p>

          <div
            className={`mt-5 rounded-[16px] border-2 p-3 ${
              isFirebaseConfigured
                ? "border-crayon-green bg-green-50 text-crayon-green"
                : "border-crayon-orange bg-orange-50 text-crayon-orange"
            }`}
          >
            <div className="flex items-center gap-3 font-bold">
              <span
                className={`h-3 w-3 rounded-full ${
                  isFirebaseConfigured ? "bg-crayon-green" : "bg-crayon-orange"
                }`}
              />
              {isFirebaseConfigured ? (
                <>
                  <Wifi size={21} />
                  Firebase SDK 已設定
                </>
              ) : (
                <>
                  <WifiOff size={21} />
                  Firebase 尚未設定
                </>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold leading-6">
              {isFirebaseConfigured
                ? "使用 Google 登入後會讀寫 Firestore / Storage，不會載入 Demo 題庫。"
                : "目前只能使用離線 Demo，本機資料不會寫入 Firebase。"}
            </p>
          </div>

          {error && (
            <p className="mt-5 rounded-[14px] border-2 border-crayon-red bg-red-50 p-3 text-sm font-bold text-crayon-red">
              {error}
            </p>
          )}

          <button
            className="sketch-button sketch-button-primary mt-7 flex w-full items-center justify-center gap-3 text-lg font-bold"
            onClick={() => void google()}
            disabled={isSubmitting}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-bold text-crayon-red">
              G
            </span>
            {isSubmitting ? "連線中..." : "使用 Google 登入"}
          </button>

          {!isFirebaseConfigured && (
            <button
              className="sketch-button mt-3 flex w-full items-center justify-center gap-3 text-lg font-bold text-slate-700"
              onClick={() => void demo()}
            >
              <Sparkles size={24} />
              離線 Demo（不寫入 Firebase）
            </button>
          )}

          <p className="mt-5 rounded-[16px] border-2 border-crayon-blue bg-blue-50 p-3 text-sm font-semibold leading-6 text-crayon-blue">
            <Database className="mr-1 inline" size={18} />
            真實操作請按「使用 Google 登入」。登入後若是新帳號，請先到設定新增小朋友，再新增錯題測試 Firestore 寫入。
          </p>
        </HandCard>
      </div>
    </div>
  );
}
