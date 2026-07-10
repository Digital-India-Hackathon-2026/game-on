import { PropsWithChildren } from "react";
export function ModalLayout({ children }: PropsWithChildren) { return <div className="fixed inset-0 grid place-items-center p-4">{children}</div>; }
