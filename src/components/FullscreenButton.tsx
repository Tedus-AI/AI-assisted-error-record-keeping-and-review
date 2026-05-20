import { Maximize2, Minimize2, Share, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement() {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function isStandaloneWebApp() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const isStandalone = isStandaloneWebApp();

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(getFullscreenElement()));

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (isStandaloneWebApp()) {
      setShowTip(true);
      return;
    }

    const doc = document as FullscreenDocument;
    const root = document.documentElement as FullscreenElement;

    try {
      if (getFullscreenElement()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
        return;
      }

      if (root.requestFullscreen) {
        await root.requestFullscreen();
      } else if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      } else {
        setShowTip(true);
      }
    } catch {
      setShowTip(true);
    }
  };

  return (
    <>
      <button
        className="touch-target flex items-center justify-center gap-2 rounded-[18px] border-2 border-crayon-blue bg-white px-3 py-2 text-sm font-bold text-crayon-blue"
        onClick={() => void toggleFullscreen()}
        title={isFullscreen ? "離開全螢幕" : isStandalone ? "已用滿版模式開啟" : "全螢幕操作"}
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        <span className="hidden xl:inline">{isFullscreen ? "離開全螢幕" : "全螢幕"}</span>
      </button>

      {showTip && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-[22px] border-2 border-crayon-blue bg-[#fff8e8] p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-crayon-blue bg-white text-crayon-blue">
                  <Smartphone size={24} />
                </div>
                <div>
                  <p className="crayon-title text-2xl">iPad 滿版操作</p>
                  <p className="text-sm font-semibold text-slate-600">
                    {isStandalone
                      ? "目前已從主畫面開啟，這就是 iPad 上最接近全螢幕的模式。"
                      : "Safari 若無法直接全螢幕，請改用主畫面開啟。"}
                  </p>
                </div>
              </div>
              <button
                className="touch-target rounded-full border-2 border-slate-400 bg-white text-slate-700"
                onClick={() => setShowTip(false)}
                title="關閉"
              >
                <X className="m-auto" size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-base font-bold leading-7 text-slate-700">
              <p className="flex gap-3">
                <span className="text-crayon-blue">1.</span>
                <span className="flex items-center gap-2">
                  點 Safari 的分享按鈕 <Share size={18} />
                </span>
              </p>
              <p className="flex gap-3">
                <span className="text-crayon-blue">2.</span>
                <span>選「加入主畫面」</span>
              </p>
              <p className="flex gap-3">
                <span className="text-crayon-blue">3.</span>
                <span>之後從主畫面打開「AI 錯題寶」，網址列會消失。</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
