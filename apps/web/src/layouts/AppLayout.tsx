import { PropsWithChildren } from "react";
import { Footer, Navbar } from "../components/ui";
export function AppLayout({ children }: PropsWithChildren) { return <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]"><Navbar><strong>Saralo</strong><a href="#/dashboard">Dashboard</a></Navbar><main className="mx-auto w-full max-w-6xl p-4">{children}</main><Footer /></div>; }
