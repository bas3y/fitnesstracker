import { useEffect, useId, useRef, type ReactNode } from 'react';
import { primaryButton } from './buttons';

/** Einfaches Fenster mit Inhalt und „Fertig“; wird vom Aufrufer nur gerendert, solange es offen ist */
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
        className="flex max-h-[90dvh] w-full max-w-sm flex-col gap-3 overflow-y-auto rounded-2xl bg-surface p-4 shadow-lg outline-none"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {children}
        <button type="button" className={primaryButton} onClick={onClose}>
          Fertig
        </button>
      </div>
    </div>
  );
}
