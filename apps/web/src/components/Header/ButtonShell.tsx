import type { ReactNode } from "react";

type ButtonShellProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  reverse?: boolean;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

export function ButtonShell({
  children,
  onClick,
  type = "button",
  reverse = false,
  className = "",
  disabled = false,
  ariaLabel,
}: ButtonShellProps) {
  return (
    <span className={`btn-border-wrap ${reverse ? "btn-border-wrap--reverse" : ""} ${className}`}>
      <button
        className="saralo-pill"
        disabled={disabled}
        onClick={onClick}
        type={type}
        aria-label={ariaLabel}
      >
        <span>{children}</span>
      </button>
    </span>
  );
}
