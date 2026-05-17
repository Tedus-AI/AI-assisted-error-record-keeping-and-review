import type { ReactNode } from "react";

const toneClass = {
  default: "sketch-card",
  blue: "sketch-card sketch-card-blue",
  green: "sketch-card sketch-card-green",
  orange: "sketch-card sketch-card-orange",
  purple: "sketch-card sketch-card-purple",
};

export function HandCard({
  children,
  className = "",
  tone = "default",
  tape = false,
}: {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof toneClass;
  tape?: boolean;
}) {
  return (
    <section className={`relative ${toneClass[tone]} ${className}`}>
      {tape && <span className="tape -top-3 right-8" aria-hidden="true" />}
      {children}
    </section>
  );
}
