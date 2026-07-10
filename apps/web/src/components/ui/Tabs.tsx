import { PropsWithChildren } from "react";
export function Tabs({ children }: PropsWithChildren) { return <div className="flex flex-col gap-3">{children}</div>; }
export function TabList({ children }: PropsWithChildren) { return <div role="tablist" className="flex gap-2 border-b border-[var(--color-border)]">{children}</div>; }
export function Tab({ children }: PropsWithChildren) { return <button role="tab" className="min-h-11 px-3 text-sm">{children}</button>; }
