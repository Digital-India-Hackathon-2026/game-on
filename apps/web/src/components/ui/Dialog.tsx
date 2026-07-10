import { PropsWithChildren } from "react";
import { Card } from "./Card";
export function Dialog({ children, open }: PropsWithChildren<{ open: boolean }>) { return open ? <div role="dialog" aria-modal="true" className="fixed inset-0 grid place-items-center bg-black/40 p-4"><Card className="w-full max-w-lg">{children}</Card></div> : null; }
export const Drawer = Dialog;
