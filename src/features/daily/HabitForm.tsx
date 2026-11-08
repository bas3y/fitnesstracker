import { useId, useState, type FormEvent } from 'react';
import { inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { EmojiPicker } from '../../components/EmojiPicker';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Stepper } from '../../components/Stepper';
import {
  habitInputSchema,
  MAX_HABIT_AMOUNT,
  MAX_HABIT_ITEMS,
  MAX_HABIT_TIMES_PER_WEEK,
  type HabitInput,
  type HabitValues,
} from '../../db/schemas';
import { HABIT_FREQUENCIES, HABIT_GROUPS, HABIT_KINDS, type HabitItem } from '../../db/types';
import { dayKey } from '../../domain/daily';
import {
  HABIT_FREQUENCY_LABELS,
  HABIT_GROUP_LABELS,
  HABIT_ICONS,
  HABIT_KIND_HINTS,
  HABIT_KIND_LABELS,
} from '../../domain/habits';
import { WEEKDAYS } from '../../domain/plans';

const LABEL = 'mb-1 block text-sm font-medium';
const HINT = 'text-sm text-muted';

export function HabitForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: HabitInput;
  submitLabel: string;
  onSubmit: (input: HabitValues) => Promise<void>;
  onCancel: () => void;
}) {
  const nameId = useId();
  const [input, setInput] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const change = (changes: Partial<HabitInput>) => {
    setInput({ ...input, ...changes });
    setError(null);
  };
  const toggleWeekday = (weekday: number) =>
    change({
      weekdays: input.weekdays.includes(weekday)
        ? input.weekdays.filter((value) => value !== weekday)
        : [...input.weekdays, weekday],
    });
  const changeKind = (kind: HabitInput['kind']) => {
    if (kind === input.kind) return;
    // Sinnvolle Startwerte je Art, damit das Formular nicht mit einem Fehler beginnt
    change({
      kind,
      target: kind === 'count' ? Math.max(input.target, 1) : kind === 'quit' ? 0 : 1,
      startDate: kind === 'quit' ? (input.startDate ?? dayKey(new Date())) : input.startDate,
      items: kind === 'items' && input.items.length === 0 ? [newItem()] : input.items,
      icon: kind === 'quit' && input.icon === '⭐' ? '🚭' : input.icon,
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = habitInputSchema.safeParse(input);
    if (result.success) await onSubmit(result.data);
    else setError(result.error.issues[0]?.message ?? 'Eingabe prüfen');
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={nameId} className={LABEL}>
              Name
            </label>
            <input
              id={nameId}
              className={inputField}
              maxLength={80}
              value={input.name}
              onChange={(event) => change({ name: event.target.value })}
            />
          </div>

          <div role="group" aria-label="Art">
            <p className={LABEL}>Art</p>
            <div className="grid grid-cols-2 gap-2">
              {HABIT_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={input.kind === kind}
                  className={`min-h-11 rounded-xl border-2 px-3 py-2 text-left ${
                    input.kind === kind ? 'border-primary bg-primary-soft' : 'border-line'
                  }`}
                  onClick={() => changeKind(kind)}
                >
                  <span className="block font-semibold">{HABIT_KIND_LABELS[kind]}</span>
                  <span className="block text-xs text-muted">{HABIT_KIND_HINTS[kind]}</span>
                </button>
              ))}
            </div>
          </div>

          <EmojiPicker
            value={input.icon}
            suggestions={HABIT_ICONS}
            onChange={(icon) => change({ icon })}
          />

          <div>
            <p className={LABEL}>Gruppe</p>
            <SegmentedControl
              label="Gruppe"
              options={HABIT_GROUPS.map((value) => ({
                value,
                label: HABIT_GROUP_LABELS[value],
              }))}
              value={input.group}
              onChange={(group) => change({ group })}
            />
          </div>

          {input.kind !== 'quit' && (
            <div>
              <p className={LABEL}>Häufigkeit</p>
              <SegmentedControl
                label="Häufigkeit"
                options={HABIT_FREQUENCIES.map((value) => ({
                  value,
                  label: HABIT_FREQUENCY_LABELS[value],
                }))}
                value={input.frequency}
                onChange={(frequency) => change({ frequency })}
              />
            </div>
          )}

          {input.kind !== 'quit' && input.frequency === 'weekly' && (
            <Stepper
              label="Mal pro Woche"
              value={input.timesPerWeek}
              step={1}
              min={1}
              max={MAX_HABIT_TIMES_PER_WEEK}
              decimals={0}
              onChange={(value) => value !== null && change({ timesPerWeek: value })}
            />
          )}
          {input.kind !== 'quit' && input.frequency === 'weekdays' && (
            <div role="group" aria-label="Wochentage">
              <p className={LABEL}>Wochentage</p>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map(({ value, label }) => (
                  <Chip
                    key={value}
                    pressed={input.weekdays.includes(value)}
                    className="px-3"
                    onClick={() => toggleWeekday(value)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {input.kind === 'count' && (
        <Card title="Ziel">
          <AmountFields
            targetLabel="Ziel pro Tag"
            target={input.target}
            unit={input.unit}
            step={input.step}
            unitPlaceholder="z. B. Seiten"
            onChange={change}
          />
        </Card>
      )}

      {input.kind === 'quit' && <QuitFields input={input} onChange={change} />}

      {input.kind === 'items' && (
        <ItemFields items={input.items} onChange={(items) => change({ items })} />
      )}

      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="mb-4 flex gap-2">
        <button type="button" className={secondaryButton} onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className={primaryButton}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function newItem(): HabitItem {
  return { id: crypto.randomUUID(), name: '', target: 1, unit: '', step: 1 };
}

function UnitField({
  value,
  placeholder,
  label = 'Einheit',
  onChange,
}: {
  value: string;
  placeholder: string;
  label?: string;
  onChange: (unit: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        className={inputField}
        maxLength={20}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** Ziel, Einheit und „Pro Tipp“ (Schrittweite der Plus-Taste); `suffix` macht Beschriftungen eindeutig */
function AmountFields({
  targetLabel,
  target,
  unit,
  step,
  unitPlaceholder,
  suffix = '',
  onChange,
}: {
  targetLabel: string;
  target: number;
  unit: string;
  step: number;
  unitPlaceholder: string;
  suffix?: string;
  onChange: (changes: { target?: number; unit?: string; step?: number }) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Stepper
        label={`${targetLabel}${suffix}`}
        value={target}
        unit={unit}
        step={1}
        min={0.01}
        max={MAX_HABIT_AMOUNT}
        decimals={2}
        onChange={(value) => value !== null && onChange({ target: value })}
      />
      <UnitField
        label={`Einheit${suffix}`}
        value={unit}
        placeholder={unitPlaceholder}
        onChange={(newUnit) => onChange({ unit: newUnit })}
      />
      <Stepper
        label={`Pro Tipp${suffix}`}
        value={step}
        unit={unit}
        step={1}
        min={0.01}
        max={MAX_HABIT_AMOUNT}
        decimals={2}
        onChange={(value) => value !== null && onChange({ step: value })}
      />
    </div>
  );
}

function QuitFields({
  input,
  onChange,
}: {
  input: HabitInput;
  onChange: (changes: Partial<HabitInput>) => void;
}) {
  const dateId = useId();
  const reduce = input.target > 0;
  return (
    <Card title="Ziel">
      <div className="flex flex-col gap-3">
        <SegmentedControl
          label="Ziel"
          options={[
            { value: 'quit', label: 'Ganz aufhören' },
            { value: 'reduce', label: 'Reduzieren' },
          ]}
          value={reduce ? 'reduce' : 'quit'}
          onChange={(mode) =>
            onChange({ target: mode === 'reduce' ? Math.max(input.target, 5) : 0 })
          }
        />
        <p className={HINT}>
          {reduce
            ? 'Ein Tag gilt als geschafft, solange du unter dem Limit bleibst.'
            : 'Jeder Tag ohne Eintrag gilt als geschafft. Trag nur Rückfälle ein.'}
        </p>
        {reduce && (
          <Stepper
            label="Tageslimit"
            value={input.target}
            unit={input.unit}
            step={1}
            min={1}
            max={MAX_HABIT_AMOUNT}
            decimals={2}
            onChange={(value) => value !== null && onChange({ target: value })}
          />
        )}
        <UnitField
          value={input.unit}
          placeholder="z. B. Zigaretten"
          onChange={(unit) => onChange({ unit })}
        />
        <Stepper
          label="Pro Tipp"
          value={input.step}
          unit={input.unit}
          step={1}
          min={0.01}
          max={MAX_HABIT_AMOUNT}
          decimals={2}
          onChange={(value) => value !== null && onChange({ step: value })}
        />
        <div>
          <label htmlFor={dateId} className={LABEL}>
            Gezählt ab
          </label>
          <input
            id={dateId}
            type="date"
            className={inputField}
            max={dayKey(new Date())}
            value={input.startDate ?? ''}
            onChange={(event) => onChange({ startDate: event.target.value || null })}
          />
        </div>
      </div>
    </Card>
  );
}

function ItemFields({
  items,
  onChange,
}: {
  items: HabitItem[];
  onChange: (items: HabitItem[]) => void;
}) {
  const changeItem = (id: string, changes: Partial<HabitItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  return (
    <Card title="Unterpunkte">
      <p className={`mb-3 ${HINT}`}>
        Erledigt, wenn alle Unterpunkte erledigt sind. Ist „Pro Tipp“ so groß wie die Menge, reicht
        ein Tipp zum Abhaken.
      </p>
      <ol aria-label="Unterpunkte" className="flex flex-col gap-4">
        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            onChange={(changes) => changeItem(item.id, changes)}
            onRemove={() => onChange(items.filter((other) => other.id !== item.id))}
          />
        ))}
      </ol>
      {items.length < MAX_HABIT_ITEMS && (
        <button
          type="button"
          className={`${secondaryButton} mt-3`}
          onClick={() => onChange([...items, newItem()])}
        >
          + Unterpunkt
        </button>
      )}
    </Card>
  );
}

function ItemRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: HabitItem;
  index: number;
  onChange: (changes: Partial<HabitItem>) => void;
  onRemove: () => void;
}) {
  const nameId = useId();
  const label = item.name.trim() || `Unterpunkt ${index + 1}`;
  return (
    <li className="rounded-xl border border-line p-3">
      <div className="mb-3 flex items-end gap-1">
        <div className="min-w-0 flex-1">
          <label htmlFor={nameId} className={LABEL}>
            Name Unterpunkt {index + 1}
          </label>
          <input
            id={nameId}
            className={inputField}
            maxLength={60}
            placeholder="z. B. Kreatin"
            value={item.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <DeleteRowButton name={label} onClick={onRemove} />
      </div>
      <AmountFields
        targetLabel="Menge"
        suffix={` (${index + 1})`}
        target={item.target}
        unit={item.unit}
        step={item.step}
        unitPlaceholder="z. B. g"
        onChange={onChange}
      />
    </li>
  );
}
