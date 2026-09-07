import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "error" | "neutral";

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}

export function Alert({ tone = "info", title, children }: { tone?: Exclude<Tone, "neutral">; title?: string; children: ReactNode }) {
  return <div className={`ui-alert ui-alert--${tone}`} role={tone === "error" ? "alert" : "status"}>{title ? <strong>{title}</strong> : null}<div>{children}</div></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <section className="ui-empty-state"><span className="ui-empty-state__mark" aria-hidden="true" /><h2>{title}</h2><p>{description}</p>{action ? <div className="ui-empty-state__action">{action}</div> : null}</section>;
}

export function PageLoading({ label = "Loading content" }: { label?: string }) {
  return <div className="ui-page-loading" role="status"><span className="ui-spinner" aria-hidden="true" /><span>{label}</span></div>;
}
