import { PropsWithChildren } from "react";
export function Navbar({ children }: PropsWithChildren) { return <nav className="flex min-h-14 items-center justify-between border-b border-[var(--color-border)] px-4">{children}</nav>; }
export function Sidebar({ children }: PropsWithChildren) { return <aside className="hidden w-64 border-r border-[var(--color-border)] p-4 md:block">{children}</aside>; }
export function Footer() { return <footer className="border-t border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">Saralo</footer>; }
export function Header({ title }: { title: string }) { return <header className="mb-4"><h1 className="text-2xl font-semibold">{title}</h1></header>; }
export function Breadcrumb({ items }: { items: string[] }) { return <div aria-label="Breadcrumb" className="text-sm text-[var(--color-muted)]">{items.join(" / ")}</div>; }
