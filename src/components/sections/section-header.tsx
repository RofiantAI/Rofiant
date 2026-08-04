import type { ReactNode } from "react";

type SectionHeaderTag = "h1" | "h2";

interface SectionHeaderProps {
  badge?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  as?: SectionHeaderTag;
  subtitleClassName?: string;
  className?: string;
}

const titleStyles: Record<SectionHeaderTag, string> = {
  h1: "text-4xl font-normal tracking-tight text-foreground sm:text-7xl lg:text-[5.5rem] leading-[1.1]",
  h2: "text-3xl font-normal tracking-tight text-foreground sm:text-5xl",
};

export function SectionHeader({
  badge,
  title,
  subtitle,
  align = "left",
  as = "h2",
  subtitleClassName = "",
  className = "",
}: SectionHeaderProps) {
  const Tag = as;
  return (
    <div className={`${align === "center" ? "text-center" : ""} ${className}`}>
      {badge}
      <Tag className={titleStyles[as]}>{title}</Tag>
      {subtitle && (
        <p className={`mt-6 text-lg leading-8 text-foreground-secondary ${subtitleClassName}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
