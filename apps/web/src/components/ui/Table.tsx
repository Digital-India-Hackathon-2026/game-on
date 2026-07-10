import { PropsWithChildren } from "react";
export function Table({ children }: PropsWithChildren) { return <div className="overflow-x-auto"><table className="w-full border-collapse text-sm">{children}</table></div>; }
