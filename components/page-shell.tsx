import type { ReactNode } from "react";
export function PageShell({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) { return <main className="page"><p className="eyebrow">{eyebrow ?? "PrePa CBT Portal"}</p><h1>{title}</h1>{children}</main>; }
