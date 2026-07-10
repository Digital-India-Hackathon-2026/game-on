import { ButtonHTMLAttributes } from "react";
import { componentVariants } from "../../design";
import { cn } from "../../utils/cn";
export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return <button className={cn(componentVariants.button.base, componentVariants.button[variant], className)} {...props} />;
}
