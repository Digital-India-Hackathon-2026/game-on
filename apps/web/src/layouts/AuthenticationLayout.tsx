import { PropsWithChildren } from "react";
export function AuthenticationLayout({ children }: PropsWithChildren) { return <main className="grid min-h-screen place-items-center bg-[var(--color-background)] p-4 text-[var(--color-text)]"><div className="w-full max-w-md">{children}</div></main>; }
