export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) { return <span title={label}>{children}</span>; }
export function Progress({ value }: { value: number }) { return <div className="h-2 rounded-full bg-[var(--color-border)]"><div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${value}%` }} /></div>; }
export function Skeleton() { return <div className="h-6 animate-pulse rounded-md bg-[var(--color-border)]" />; }
export function Spinner() { return <span aria-label="Loading" className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />; }
