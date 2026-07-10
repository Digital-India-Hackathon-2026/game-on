import { TextareaHTMLAttributes } from "react";
import { componentVariants } from "../../design";
import { cn } from "../../utils/cn";
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(componentVariants.input, "min-h-28 py-3", className)} {...props} />;
}
