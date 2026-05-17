import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarCheck,
  ChevronDown,
  CirclePlus,
  Cpu,
  Home,
  KeyRound,
  Lock,
  LogOut,
  Settings,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAppData } from "../hooks/useAppData";

const navItems = [
  { to: "/", label: "首頁總覽", shortLabel: "首頁", icon: Home },
  {
    to: "/add-question",
    label: "新增錯題",
    shortLabel: "新增",
    icon: CirclePlus,
    parentOnly: true,
  },
  {
    to: "/question-bank",
    label: "題庫",
    shortLabel: "題庫",
    icon: BookOpen,
    parentOnly: true,
  },
  { to: "/practice-setup", label: "開始複習", shortLabel: "複習", icon: CalendarCheck },
  { to: "/stats", label: "統計", shortLabel: "統計", icon: BarChart3 },
  {
    to: "/children",
    label: "小朋友設定",
    shortLabel: "孩子",
    icon: Settings,
    parentOnly: true,
  },
  {
    to: "/ai-settings",
    label: "AI 與 PIN 設定",
    shortLabel: "設定",
    icon: Cpu,
    parentOnly: true,
  },
];

function navClass({ isActive }: { isActive: boolean }) {
  return `flex touch-target items-center gap-3 rounded-[18px] border-2 px-4 py-3 text-lg font-bold transition ${
    isActive
      ? "border-crayon-blue bg-crayon-light text-crayon-blue shadow-sketch"
      : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-white/60"
  }`;
}

export function AppShell() {
  const {
    user,
    selectedChild,
    children,
    selectChild,
    logout,
    aiUsage,
    hasParentPin,
    isParentMode,
    unlockParentMode,
    lockParentMode,
  } = useAppData();
  const navigate = useNavigate();
  const parentAccessAllowed = !hasParentPin || isParentMode;
  const visibleNavItems = navItems.filter(
    (item) => !item.parentOnly || parentAccessAllowed
  );

  const handleParentMode = async () => {
    if (!hasParentPin) {
      navigate("/ai-settings");
      return;
    }

    if (isParentMode) {
      lockParentMode();
      navigate("/");
      return;
    }

    const pin = window.prompt("請輸入家長 PIN 碼");
    if (pin === null) return;

    try {
      await unlockParentMode(pin.trim());
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "PIN 驗證失敗");
    }
  };

  return (
    <div className="min-h-dvh p-2 sm:p-4">
      <div className="mx-auto grid min-h-[calc(100dvh-1rem)] max-w-[1500px] grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="paper-shell hidden rounded-[24px] border-4 border-crayon-blue p-5 shadow-soft lg:flex lg:flex-col">
          <Logo />

          <div className="mt-8 rounded-[18px] border-2 border-slate-500 bg-white/55 p-3">
            <label className="sr-only" htmlFor="child-switcher">
              選擇小朋友
            </label>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crayon-light text-2xl">
                {selectedChild?.name.slice(0, 1) ?? "孩"}
              </div>
              <select
                id="child-switcher"
                className="w-full bg-transparent text-base font-bold outline-none"
                value={selectedChild?.id ?? ""}
                onChange={(event) => selectChild(event.target.value)}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} | {child.grade}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} />
            </div>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-3">
            {visibleNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} end={item.to === "/"}>
                <item.icon size={30} strokeWidth={2.6} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {parentAccessAllowed && (
            <div className="sketch-card-blue mt-6 p-4">
              <div className="mb-3 flex items-center gap-2 text-crayon-blue">
                <Bot size={28} />
                <p className="crayon-title text-xl">AI 題目整理助手</p>
              </div>
              <p className="text-sm font-semibold leading-6 text-slate-600">
                AI 只在建檔時幫忙整理題目，孩子複習時不會消耗 AI 額度。
              </p>
              <button
                className="sketch-button mt-4 px-4 text-sm font-bold text-crayon-blue"
                onClick={() => navigate("/add-question")}
              >
                開始建檔
              </button>
            </div>
          )}
        </aside>

        <div className="min-w-0">
          <header className="mb-4 flex items-center justify-between rounded-[24px] border-2 border-slate-300 bg-white/50 px-4 py-3 shadow-soft backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <Logo compact />
              </div>
              <div>
                <p className="font-hand text-lg font-bold">Tedus 家長您好</p>
                <p className="text-xs font-semibold text-slate-500">
                  {selectedChild ? `${selectedChild.name} | ${selectedChild.grade}` : "尚未選擇小朋友"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-[18px] border-2 border-crayon-blue bg-white px-3 py-2 text-sm font-bold text-crayon-blue sm:flex">
                <Bot size={18} />
                今日 AI 解析 {aiUsage.dailyAiCallCount}/{user?.isDemo ? 10 : 1500}
              </div>
              <button
                className={`hidden items-center gap-2 rounded-[18px] border-2 bg-white px-3 py-2 text-sm font-bold sm:flex ${
                  parentAccessAllowed
                    ? "border-crayon-green text-crayon-green"
                    : "border-crayon-orange text-crayon-orange"
                }`}
                onClick={() => void handleParentMode()}
                title={
                  !hasParentPin
                    ? "設定家長 PIN"
                    : parentAccessAllowed
                      ? "鎖定家長模式"
                      : "解鎖家長模式"
                }
              >
                {!hasParentPin ? (
                  <KeyRound size={18} />
                ) : parentAccessAllowed ? (
                  <Unlock size={18} />
                ) : (
                  <Lock size={18} />
                )}
                {!hasParentPin
                  ? "設定 PIN"
                  : parentAccessAllowed
                    ? "家長模式"
                    : "解鎖家長"}
              </button>
              <button
                className="touch-target rounded-full border-2 border-slate-400 bg-white text-slate-700"
                onClick={() => void logout()}
                title="登出"
              >
                <LogOut className="m-auto" size={22} />
              </button>
            </div>
          </header>

          <main className="rounded-[28px] border-2 border-slate-300 bg-white/35 p-4 pb-28 shadow-soft backdrop-blur sm:p-6 lg:min-h-[calc(100dvh-7rem)] lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-2 bottom-2 z-30 grid grid-cols-5 gap-2 rounded-[24px] border-2 border-crayon-blue bg-[#fff8e8]/95 p-2 shadow-soft backdrop-blur sm:grid-cols-7 lg:hidden">
        {visibleNavItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `${index >= 5 ? "hidden sm:flex" : "flex"} min-h-[58px] flex-col items-center justify-center rounded-[18px] text-xs font-bold ${
                isActive ? "bg-crayon-light text-crayon-blue" : "text-slate-600"
              }`
            }
          >
            <item.icon size={25} strokeWidth={2.5} />
            <span>{item.shortLabel}</span>
          </NavLink>
        ))}
      </nav>

      <button
        className={`fixed bottom-20 right-4 flex items-center gap-2 rounded-full border-2 bg-white px-4 py-2 text-sm font-bold shadow-soft sm:hidden ${
          parentAccessAllowed
            ? "border-crayon-green text-crayon-green"
            : "border-crayon-orange text-crayon-orange"
        }`}
        onClick={() => void handleParentMode()}
      >
        {!hasParentPin ? (
          <KeyRound size={18} />
        ) : parentAccessAllowed ? (
          <Unlock size={18} />
        ) : (
          <Lock size={18} />
        )}
        {!hasParentPin ? "設定 PIN" : parentAccessAllowed ? "家長模式" : "解鎖"}
      </button>

      <div className="fixed bottom-20 left-4 hidden items-center gap-2 rounded-full border-2 border-crayon-green bg-green-50 px-4 py-2 text-sm font-bold text-crayon-green sm:flex lg:hidden">
        <ShieldCheck size={18} />
        複習不消耗 AI
      </div>
    </div>
  );
}
