import { useEffect, useId, useRef, type ReactNode } from 'react';
import { primaryButton, secondaryButton } from './buttons';

/** Rückfrage vor einer Aktion; wird vom Aufrufer nur gerendert, solange sie offen ist */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
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
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel();
        }}
        className="w-full max-w-sm rounded-2xl bg-surface p-4 shadow-lg outline-none"
      >
        <h2 id={titleId} className="mb-2 text-lg font-semibold">
          {title}
        </h2>
        {children && <div className="mb-4 text-sm text-muted">{children}</div>}
        <div className="flex gap-2">
          <button type="button" className={secondaryButton} onClick={onCancel}>
            Abbrechen
          </button>
          <button type="button" className={primaryButton} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
