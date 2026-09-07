import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
};

export function Button({ variant = "primary", loading = false, disabled, className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`ui-button ui-button--${variant} ${className}`.trim()} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
