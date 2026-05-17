import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { CropMeta } from "../types";

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
type DragMode = "move" | ResizeHandle;

interface ActiveDrag {
  mode: DragMode;
  pointerId: number;
  startX: number;
  startY: number;
  startCrop: CropMeta;
  bounds: {
    width: number;
    height: number;
  };
}

const MIN_CROP_SIZE = 10;

const handles: { mode: ResizeHandle; label: string; className: string }[] = [
  {
    mode: "nw",
    label: "左上角",
    className: "-left-4 -top-4 h-8 w-8 cursor-nwse-resize",
  },
  {
    mode: "n",
    label: "上邊",
    className: "left-1/2 -top-4 h-8 w-12 -translate-x-1/2 cursor-ns-resize",
  },
  {
    mode: "ne",
    label: "右上角",
    className: "-right-4 -top-4 h-8 w-8 cursor-nesw-resize",
  },
  {
    mode: "e",
    label: "右邊",
    className: "-right-4 top-1/2 h-12 w-8 -translate-y-1/2 cursor-ew-resize",
  },
  {
    mode: "se",
    label: "右下角",
    className: "-bottom-4 -right-4 h-8 w-8 cursor-nwse-resize",
  },
  {
    mode: "s",
    label: "下邊",
    className: "-bottom-4 left-1/2 h-8 w-12 -translate-x-1/2 cursor-ns-resize",
  },
  {
    mode: "sw",
    label: "左下角",
    className: "-bottom-4 -left-4 h-8 w-8 cursor-nesw-resize",
  },
  {
    mode: "w",
    label: "左邊",
    className: "-left-4 top-1/2 h-12 w-8 -translate-y-1/2 cursor-ew-resize",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function normalizeCrop(next: CropMeta): CropMeta {
  const width = clamp(next.width, MIN_CROP_SIZE, 100);
  const height = clamp(next.height, MIN_CROP_SIZE, 100);
  return {
    x: roundPercent(clamp(next.x, 0, 100 - width)),
    y: roundPercent(clamp(next.y, 0, 100 - height)),
    width: roundPercent(width),
    height: roundPercent(height),
  };
}

function resizeCrop(start: CropMeta, mode: ResizeHandle, deltaX: number, deltaY: number) {
  const startLeft = start.x;
  const startTop = start.y;
  const startRight = start.x + start.width;
  const startBottom = start.y + start.height;
  let left = startLeft;
  let top = startTop;
  let right = startRight;
  let bottom = startBottom;

  if (mode.includes("w")) {
    left = clamp(startLeft + deltaX, 0, startRight - MIN_CROP_SIZE);
  }
  if (mode.includes("e")) {
    right = clamp(startRight + deltaX, startLeft + MIN_CROP_SIZE, 100);
  }
  if (mode.includes("n")) {
    top = clamp(startTop + deltaY, 0, startBottom - MIN_CROP_SIZE);
  }
  if (mode.includes("s")) {
    bottom = clamp(startBottom + deltaY, startTop + MIN_CROP_SIZE, 100);
  }

  return normalizeCrop({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });
}

export function CropSelector({
  imageUrl,
  crop,
  onChange,
}: {
  imageUrl: string;
  crop: CropMeta;
  onChange: (crop: CropMeta) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const startDrag = (event: ReactPointerEvent, mode: DragMode) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const frame = frameRef.current;
    const bounds = frame?.getBoundingClientRect();
    if (!frame || !bounds?.width || !bounds.height) return;

    event.preventDefault();
    event.stopPropagation();
    frame.setPointerCapture(event.pointerId);
    activeDragRef.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: normalizeCrop(crop),
      bounds: {
        width: bounds.width,
        height: bounds.height,
      },
    };
    setIsInteracting(true);
  };

  const handlePointerMove = (event: ReactPointerEvent) => {
    const active = activeDragRef.current;
    if (!active) return;

    const deltaX = ((event.clientX - active.startX) / active.bounds.width) * 100;
    const deltaY = ((event.clientY - active.startY) / active.bounds.height) * 100;

    if (active.mode === "move") {
      onChange(
        normalizeCrop({
          ...active.startCrop,
          x: active.startCrop.x + deltaX,
          y: active.startCrop.y + deltaY,
        })
      );
      return;
    }

    onChange(resizeCrop(active.startCrop, active.mode, deltaX, deltaY));
  };

  const endDrag = (event: ReactPointerEvent) => {
    const active = activeDragRef.current;
    if (!active) return;

    if (frameRef.current?.hasPointerCapture(active.pointerId)) {
      frameRef.current.releasePointerCapture(active.pointerId);
    }
    activeDragRef.current = null;
    setIsInteracting(false);
    event.stopPropagation();
  };

  return (
    <div className="space-y-3">
      <div
        ref={frameRef}
        className={`relative overflow-hidden rounded-[20px] border-4 border-slate-700 bg-slate-100 touch-none ${
          isInteracting ? "cursor-grabbing" : "cursor-crosshair"
        }`}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          src={imageUrl}
          alt="題目照片"
          className="block max-h-[520px] w-full select-none object-contain"
          draggable={false}
        />
        <div
          className="absolute border-4 border-crayon-blue bg-blue-100/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.26)] touch-none"
          style={{
            left: `${crop.x}%`,
            top: `${crop.y}%`,
            width: `${crop.width}%`,
            height: `${crop.height}%`,
          }}
          onPointerDown={(event) => startDrag(event, "move")}
          title="拖曳移動框選範圍"
        >
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border-2 border-crayon-blue bg-white/90 px-3 py-1 text-xs font-bold text-crayon-blue shadow-soft">
              拖曳移動
            </span>
          </div>
          {handles.map((handle) => (
            <button
              key={handle.mode}
              type="button"
              aria-label={`調整框選${handle.label}`}
              title={`拖曳調整${handle.label}`}
              className={`absolute rounded-full border-2 border-crayon-blue bg-white/95 shadow-soft touch-none ${handle.className}`}
              onPointerDown={(event) => startDrag(event, handle.mode)}
            />
          ))}
        </div>
      </div>
      <p className="text-center text-sm font-bold leading-6 text-crayon-blue md:whitespace-nowrap">
        拖曳藍框可移動位置；拖曳四角或邊線可調整大小。iPad 可以直接用手指操作。
      </p>
    </div>
  );
}
