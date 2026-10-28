import type { ReactNode } from 'react';

export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
      {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function PlaceholderPage({ title, text }: { title: string; text: string }) {
  return (
    <Page title={title}>
      <Card>
        <p className="text-slate-600 dark:text-slate-400">{text}</p>
      </Card>
    </Page>
  );
}
