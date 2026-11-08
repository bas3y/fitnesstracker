import { useState } from 'react';
import { ICON_GROUPS, ICON_LABELS } from '../domain/iconChoice';
import { Dialog } from './Dialog';
import { Icon, type IconName } from './icons';

/**
 * Symbol wählen: aktuelles Symbol als Button, Auswahl nach Gruppen im Fenster.
 * `optional`: leer = Standard-Symbol (`fallback`), wählbar über „Standard“.
 */
export function IconPicker({
  value,
  onChange,
  label = 'Symbol',
  optional = false,
  fallback = 'star',
}: {
  value: IconName | '';
  onChange: (icon: IconName | '') => void;
  label?: string;
  optional?: boolean;
  /** Angezeigtes Symbol bei leerem Wert */
  fallback?: IconName;
}) {
  const [open, setOpen] = useState(false);
  const shown: IconName = value || fallback;
  const choose = (icon: IconName | '') => {
    onChange(icon);
    setOpen(false);
  };
  const option = (icon: IconName, selected: boolean, name: string, text?: string) => (
    <button
      key={name}
      type="button"
      aria-pressed={selected}
      aria-label={name}
      className={`flex h-12 items-center justify-center gap-2 rounded-xl ${text ? 'px-3' : ''} ${
        selected ? 'bg-primary text-on-primary' : 'bg-subtle text-fg active:bg-pressed'
      }`}
      onClick={() => choose(name === 'Standard' ? '' : icon)}
    >
      <Icon name={icon} className="h-6 w-6" />
      {text && <span className="text-sm font-medium">{text}</span>}
    </button>
  );

  return (
    <div>
      <p className="mb-1 block text-sm font-medium">{label}</p>
      <button
        type="button"
        className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-line bg-subtle px-3 text-left active:bg-pressed"
        onClick={() => setOpen(true)}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-on-primary-soft">
          <Icon name={shown} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">{value ? ICON_LABELS[value] : 'Standard'}</span>
        <span className="text-sm font-medium text-primary-text">{label} ändern</span>
      </button>
      {open && (
        <Dialog title={`${label} wählen`} onClose={() => setOpen(false)}>
          {optional && (
            <div className="flex">{option(fallback, value === '', 'Standard', 'Standard')}</div>
          )}
          {ICON_GROUPS.map((group) => (
            <section key={group.name} aria-label={group.name}>
              <h3 className="mb-2 text-sm font-semibold text-muted">{group.name}</h3>
              <div className="grid grid-cols-5 gap-2 min-[360px]:grid-cols-6">
                {group.icons.map((icon) =>
                  option(icon, value === icon, `Symbol ${ICON_LABELS[icon]}`),
                )}
              </div>
            </section>
          ))}
        </Dialog>
      )}
    </div>
  );
}
