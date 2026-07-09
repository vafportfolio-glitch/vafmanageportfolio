import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border-subtle
        bg-bg-surface p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]
        before:absolute before:inset-x-0 before:top-0 before:h-[2px]
        before:bg-[image:var(--gradient-brand)] before:opacity-70
        ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 flex items-center justify-between ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-base font-semibold text-fg-primary ${className}`} {...props} />;
}

export function CardDescription({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-fg-muted ${className}`} {...props} />;
}
