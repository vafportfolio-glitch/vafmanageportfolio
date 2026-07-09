import { HTMLAttributes } from "react";

type BadgeVariant = "success" | "info" | "warning" | "danger" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-brand-green/15 text-brand-green border-brand-green/30",
  info: "bg-brand-blue/15 text-brand-blue border-brand-blue/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  neutral: "bg-bg-surface-hover text-fg-secondary border-border-default",
};

export function Badge({ variant = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium
        ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
