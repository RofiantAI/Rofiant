import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

type IconFeatureTone = "primary" | "secondary" | "success" | "warning" | "orange";

const toneStyles: Record<IconFeatureTone, string> = {
  primary: "bg-accent-primary/10 text-accent-primary",
  secondary: "bg-accent-secondary/10 text-accent-secondary",
  success: "bg-accent-success/10 text-accent-success",
  warning: "bg-accent-warning/10 text-accent-warning",
  orange: "bg-accent-orange/10 text-accent-orange",
};

interface IconFeatureProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: IconFeatureTone;
  action?: ReactNode;
  className?: string;
}

export function IconFeature({
  icon: Icon,
  title,
  description,
  tone = "primary",
  action,
  className = "",
}: IconFeatureProps) {
  return (
    <Card variant="bordered" className={`p-6 h-full ${className}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${toneStyles[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-foreground-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
