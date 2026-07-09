import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "text-fg-on-brand bg-[image:var(--gradient-green)] hover:bg-[image:var(--gradient-green-hover)] hover:shadow-[var(--shadow-glow-green)] active:brightness-90",
  secondary:
    "text-fg-on-brand bg-[image:var(--gradient-blue)] hover:bg-[image:var(--gradient-blue-hover)] hover:shadow-[var(--shadow-glow-blue)] active:brightness-90",
  outline:
    "bg-transparent border border-border-strong text-fg-primary hover:bg-bg-surface-hover hover:border-brand-green-600",
  ghost: "bg-transparent text-fg-secondary hover:bg-bg-surface-hover hover:text-fg-primary",
  danger: "bg-danger text-fg-on-brand hover:bg-danger-hover",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 rounded-md font-medium
          transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
          ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
