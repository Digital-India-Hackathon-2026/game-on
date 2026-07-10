import { PropsWithChildren } from "react";
export function Avatar({ name }: { name: string }) { return <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-primaryText)]">{name.slice(0, 1)}</span>; }
export function Badge({ children }: PropsWithChildren) { return <span className="rounded-full bg-[var(--color-border)] px-2 py-1 text-xs">{children}</span>; }
export const Chip = Badge;
