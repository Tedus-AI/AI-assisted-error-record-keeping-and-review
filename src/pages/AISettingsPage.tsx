import { useState } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { GoogleAISettingsCard } from "../components/GoogleAISettingsCard";
import { HandCard } from "../components/HandCard";
import { PageHeader } from "../components/PageHeader";
import { useAppData } from "../hooks/useAppData";

function ParentPinSettingsCard() {
  const { hasParentPin, setParentPin } = useAppData();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setMessage("");
    setError("");

    if (!/^\d{4}$/.test(pin)) {
      setError("PIN 必須是 4 位數字。");
      return;
    }
    if (pin !== confirmPin) {
      setError("兩次輸入的 PIN 不一致。");
      return;
    }

    setIsSaving(true);
    try {
      await setParentPin(pin);
      setPin("");
      setConfirmPin("");
      setMessage("家長 PIN 已儲存，家長模式已解鎖 15 分鐘。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN 儲存失敗，請稍後再試。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <HandCard className="p-5" tone="purple" tape>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-crayon-purple">
          <KeyRound size={26} />
        </div>
        <div>
          <h2 className="crayon-title text-3xl">家長 PIN</h2>
          <p className="text-sm font-bold text-slate-500">
            {hasParentPin ? "已設定 PIN，可在這裡重新設定。" : "尚未設定 PIN，設定後會啟用小朋友模式。"}
          </p>
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-green bg-green-50 p-3 text-sm font-bold text-crayon-green">
          <ShieldCheck className="mr-2 inline" size={18} />
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-red bg-red-50 p-3 text-sm font-bold text-crayon-red">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block font-bold">新的 4 位 PIN</span>
          <input
            className="sketch-input"
            inputMode="numeric"
            maxLength={4}
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="例如 1234"
          />
        </label>
        <label>
          <span className="mb-2 block font-bold">再次輸入 PIN</span>
          <input
            className="sketch-input"
            inputMode="numeric"
            maxLength={4}
            type="password"
            value={confirmPin}
            onChange={(event) =>
              setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="再輸入一次"
          />
        </label>
      </div>

      <button
        className="sketch-button sketch-button-primary mt-5 flex w-full items-center justify-center gap-2 text-xl font-bold"
        disabled={isSaving}
        onClick={() => void save()}
      >
        <Save size={24} />
        {isSaving ? "儲存中..." : hasParentPin ? "更新家長 PIN" : "設定家長 PIN"}
      </button>
    </HandCard>
  );
}

export function AISettingsPage() {
  return (
    <div>
      <PageHeader
        title="AI 與安全設定"
        eyebrow="管理 Google AI Studio API Key，並設定家長 PIN 保護管理功能。"
      />
      <div className="grid max-w-5xl gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ParentPinSettingsCard />
        <GoogleAISettingsCard />
      </div>
    </div>
  );
}
