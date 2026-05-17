export function MasteryDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`熟練度 ${level} / 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`h-3 w-3 rounded-full border border-slate-300 ${
            index < level ? "bg-crayon-green" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}
