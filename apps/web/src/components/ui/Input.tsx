import { InputHTMLAttributes } from "react";
import { componentVariants } from "../../design";
import { cn } from "../../utils/cn";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(componentVariants.input, className)} {...props} />;
}
