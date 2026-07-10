import { PropsWithChildren } from "react";
export function Accordion({ title, children }: PropsWithChildren<{ title: string }>) { return <details className="rounded-md border border-[var(--color-border)] p-3"><summary className="cursor-pointer font-medium">{title}</summary><div className="pt-3">{children}</div></details>; }
