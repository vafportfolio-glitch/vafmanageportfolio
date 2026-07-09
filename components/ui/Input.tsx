import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  trailingAction?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, trailingAction, className = "", id, ...props }, ref) => {
    const inputId = id ?? props.name;
    const hasAdornment = icon || trailingAction;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-fg-secondary">
            {label}
          </label>
        )}
        <div className={hasAdornment ? "relative flex items-center" : undefined}>
          {icon && (
            <span className="pointer-events-none absolute left-0 top-0 h-10 w-9 flex items-center justify-center text-fg-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`h-10 w-full rounded-md border bg-bg-surface-raised text-sm text-fg-primary
              placeholder:text-fg-muted outline-none transition-colors
              ${icon ? "pl-9" : "px-3"}
              ${trailingAction ? "pr-10" : "px-3"}
              ${icon && trailingAction ? "pl-9 pr-10" : ""}
              ${error ? "border-danger" : "border-border-default focus:border-brand-blue"}
              ${className}`}
            {...props}
          />
          {trailingAction && (
            <span className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center">
              {trailingAction}
            </span>
          )}
        </div>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
