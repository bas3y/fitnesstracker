import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons';
import { lockScroll } from './scrollRoot';

/**
 * Rundes „i“ mit Erklärung (seit 22e, Variante B): Das Blatt gleitet am Handy von unten herein,
 * ab `lg` erscheint es mittig. ✕, Antippen daneben und Escape schließen.
 * Erklärungen gehören hierher statt als Satz unter Überschriften, Schalter oder Kennzahlen.
 */
export function InfoButton({
  title,
  children,
  className = '',
}: {
  /** Name des erklärten Elements (Überschrift des Blatts, „Info: …“ für Screenreader) */
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={`Info: ${title}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => {
          // Kann in antippbaren Zeilen/Kacheln stecken: nur das Blatt öffnen
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-subtle active:bg-pressed ${
          open ? 'bg-primary-soft text-on-primary-soft' : ''
        } ${className}`}
      >
        <Icon name="info" className="h-[1.375rem] w-[1.375rem]" />
      </button>
      {open && (
        <InfoSheet
          title={title}
          onClose={() => {
            setOpen(false);
            button.current?.focus();
          }}
        >
          {children}
        </InfoSheet>
      )}
    </>
  );
}

function InfoSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sheet.current?.focus();
    return lockScroll();
  }, []);

  return createPortal(
    // Das Blatt liegt im DOM außerhalb, React-Ereignisse würden aber zur Zeile/Kachel durchreichen
    <div
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="anim-fade-in fixed inset-0 z-50 bg-scrim" onClick={onClose} />
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
        className="anim-sheet fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl bg-surface pt-2 pr-[max(1.25rem,env(safe-area-inset-right))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] text-fg shadow-2xl outline-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:w-[min(28rem,calc(100vw-4rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:pt-4 lg:pb-5"
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-1 h-1.5 w-10 rounded-full bg-line-strong lg:hidden"
        />
        <div className="mb-2 flex items-center gap-3">
          <h2 id={titleId} className="min-w-0 flex-1 text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Schließen"
            onClick={onClose}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-subtle text-muted hover:bg-subtle-strong active:bg-pressed"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-2 text-[0.9375rem] leading-relaxed">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
