import { HTMLAttributes } from "react";
import { componentVariants } from "../../design";
import { cn } from "../../utils/cn";
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <section className={cn(componentVariants.card, className)} {...props} />; }
