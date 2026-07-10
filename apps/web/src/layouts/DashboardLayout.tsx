import { PropsWithChildren } from "react";
import { Sidebar } from "../components/ui";
export function DashboardLayout({ children }: PropsWithChildren) { return <div className="grid min-h-[70vh] md:grid-cols-[16rem_1fr]"><Sidebar><a href="#/viewer">Website Viewer</a><br/><a href="#/settings">Settings</a></Sidebar><div className="p-4">{children}</div></div>; }
