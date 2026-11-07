import { useId, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dangerButton, inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Dialog } from '../../components/Dialog';
import { Card, Page } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { SortableList } from '../../components/SortableList';
import { Stepper } from '../../components/Stepper';
import { setPlanBlocks, startPlanBlock, stopPlanBlocks, updatePlan } from '../../db/plans';
import {
  MAX_BLOCK_PERCENT,
  MAX_BLOCK_REP_SHIFT,
  MAX_BLOCK_WEEKS,
  MAX_PLAN_BLOCKS,
  MIN_BLOCK_PERCENT,
} from '../../db/schemas';
import { BLOCK_KINDS, type DayKey, type Plan, type PlanBlock } from '../../db/types';
import {
  BLOCK_DEFAULTS,
  BLOCK_KIND_HINTS,
  BLOCK_TEMPLATES,
  blocksFromTemplate,
  formatAdjustment,
  formatWeeks,
  newBlock,
} from '../../domain/blocks';
import { dayKey } from '../../domain/daily';
import { BLOCK_KIND_LABELS } from '../../domain/labels';
import { PLANS_PATH } from '../training/paths';
import { useNow } from '../training/useWorkouts';
import { BlockStatusPanel } from './BlockStatus';
import { usePlanDetail } from './usePlans';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';

export function PlanBlocksPage() {
  const { id } = useParams();
  const detail = usePlanDetail(id);
  const backTo = `${PLANS_PATH}/${id}`;

  if (detail === undefined) {
    return (
      <Page title="Trainingsblöcke" backTo={backTo}>
        {null}
      </Page>
    );
  }
  if (detail === null) {
    return (
      <Page title="Trainingsblöcke" backTo={backTo}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">Dieser Plan existiert nicht mehr.</p>
        </Card>
      </Page>
    );
  }
  return <BlocksEditor plan={detail.plan} backTo={backTo} />;
}

function BlocksEditor({ plan, backTo }: { plan: Plan; backTo: string }) {
  const today = dayKey(useNow(true, 60_000));
  return (
    <Page title="Trainingsblöcke" backTo={backTo}>
      {plan.blocks.length === 0 ? (
        <BlockTemplates plan={plan} today={today} />
      ) : (
        <>
          <CurrentBlockCard plan={plan} today={today} />
          <AdjustCard plan={plan} />
          <BlockSequence plan={plan} />
        </>
      )}
    </Page>
  );
}

function BlockTemplates({ plan, today }: { plan: Plan; today: DayKey }) {
  const choose = async (blocks: PlanBlock[]) => {
    await setPlanBlocks(plan.id, blocks);
    await startPlanBlock(plan.id, 0, today);
  };
  return (
    <>
      <Card>
        <p className="text-slate-600 dark:text-slate-400">
          Teile „{plan.name}“ in Blöcke: z. B. ein paar Wochen Aufbau, dann eine leichte
          Deload-Woche. Beim Start eines Trainings werden die Sätze passend zum Block vorbefüllt.
        </p>
      </Card>
      <h2 className="mb-2 text-lg font-semibold">Vorlage wählen</h2>
      <ul aria-label="Vorlagen für Blöcke" className="mb-4 flex flex-col gap-2">
        {BLOCK_TEMPLATES.map((template) => (
          <li key={template.key}>
            <button
              type="button"
              className={secondaryButton}
              onClick={() => void choose(blocksFromTemplate(template))}
            >
              {template.name}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={primaryButton}
        onClick={() => void choose([newBlock('build')])}
      >
        Eigene Abfolge
      </button>
      <p className={`${HINT} mt-2`}>Startet heute mit dem ersten Block, alles bleibt änderbar.</p>
    </>
  );
}

function CurrentBlockCard({ plan, today }: { plan: Plan; today: DayKey }) {
  const dateId = useId();
  const progress = plan.blockProgress;
  const labels = Object.fromEntries(
    plan.blocks.map((block, index) => [
      String(index),
      `${index + 1}. ${BLOCK_KIND_LABELS[block.kind]} (${formatWeeks(block.weeks)})`,
    ]),
  );

  if (!progress) {
    return (
      <Card title="Aktueller Block">
        <p className="mb-3 text-slate-600 dark:text-slate-400">
          Die Blöcke laufen gerade nicht – Trainings werden wie gewohnt vorbefüllt.
        </p>
        <button
          type="button"
          className={primaryButton}
          onClick={() => void startPlanBlock(plan.id, 0, today)}
        >
          Blöcke ab heute starten
        </button>
      </Card>
    );
  }
  return (
    <Card title="Aktueller Block">
      <BlockStatusPanel plan={plan} today={today} />
      <div className="flex flex-col gap-3">
        <Select
          label="Block"
          value={String(Math.min(progress.index, plan.blocks.length - 1))}
          options={plan.blocks.map((_, index) => String(index))}
          labels={labels}
          onChange={(value) => {
            if (value !== null) void startPlanBlock(plan.id, Number(value), today);
          }}
        />
        <div>
          <label htmlFor={dateId} className="mb-1 block text-sm font-medium">
            Beginn des Blocks
          </label>
          <input
            id={dateId}
            type="date"
            className={inputField}
            value={progress.startDate}
            onChange={(event) => {
              if (event.target.value) {
                void startPlanBlock(plan.id, progress.index, event.target.value);
              }
            }}
          />
          <p className={`${HINT} mt-1`}>Ein anderer Block beginnt heute.</p>
        </div>
        <button
          type="button"
          className={secondaryButton}
          onClick={() => void stopPlanBlocks(plan.id)}
        >
          Blöcke anhalten
        </button>
      </div>
    </Card>
  );
}

function AdjustCard({ plan }: { plan: Plan }) {
  return (
    <Card title="Sätze anpassen">
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-emerald-600"
          checked={plan.blockAdjust}
          onChange={(event) => void updatePlan(plan.id, { blockAdjust: event.target.checked })}
        />
        Sätze automatisch an den Block anpassen
      </label>
      <p className={HINT}>
        {plan.blockAdjust
          ? 'Beim Start werden Sätze, Gewicht und Wdh. nach dem Block vorbefüllt. Im Training kannst du alles ändern.'
          : 'Aus: Der Block wird nur angezeigt, die Sätze bleiben wie gewohnt.'}
      </p>
    </Card>
  );
}

function BlockSequence({ plan }: { plan: Plan }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<PlanBlock | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const { blocks } = plan;
  const editing = blocks.find((block) => block.id === editingId);
  const totalWeeks = blocks.reduce((sum, block) => sum + block.weeks, 0);
  const save = (next: PlanBlock[]) => setPlanBlocks(plan.id, next);

  return (
    <>
      <h2 className="mb-1 text-lg font-semibold">Abfolge</h2>
      <p className={`${HINT} mb-2`}>{formatWeeks(totalWeeks)} insgesamt. Antippen zum Ändern.</p>
      <SortableList
        label="Blöcke"
        items={blocks.map((block, index) => ({
          ...block,
          name: `${index + 1}. ${BLOCK_KIND_LABELS[block.kind]}`,
        }))}
        onReorder={(ids) =>
          save(ids.map((id) => blocks.find((block) => block.id === id)!).filter(Boolean))
        }
        renderItem={(item, { handle }) => (
          <div className="mb-2 flex min-h-14 items-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
            {handle}
            <button
              type="button"
              className="flex min-h-14 min-w-0 flex-1 flex-col justify-center rounded-2xl px-4 py-3 text-left active:bg-slate-50 dark:active:bg-slate-700"
              onClick={() => setEditingId(item.id)}
            >
              <span className="block font-medium">
                {item.name} · {formatWeeks(item.weeks)}
              </span>
              <span className={`block ${HINT}`}>{formatAdjustment(item)}</span>
            </button>
            <DeleteRowButton name={item.name} onClick={() => setRemoving(item)} />
          </div>
        )}
      />
      {blocks.length < MAX_PLAN_BLOCKS && (
        <button
          type="button"
          className={`${secondaryButton} mt-2`}
          onClick={async () => {
            const block = newBlock('deload');
            await save([...blocks, block]);
            setEditingId(block.id);
          }}
        >
          + Block hinzufügen
        </button>
      )}
      <button
        type="button"
        className={`${dangerButton} mt-6 mb-4`}
        onClick={() => setConfirmClear(true)}
      >
        Alle Blöcke entfernen
      </button>

      {editing && (
        <BlockDialog
          block={editing}
          onChange={(changed) =>
            void save(blocks.map((block) => (block.id === changed.id ? changed : block)))
          }
          onClose={() => setEditingId(null)}
        />
      )}
      {removing && (
        <ConfirmDialog
          title={`Block „${BLOCK_KIND_LABELS[removing.kind]}“ entfernen?`}
          confirmLabel="Entfernen"
          onCancel={() => setRemoving(null)}
          onConfirm={async () => {
            await save(blocks.filter((block) => block.id !== removing.id));
            setRemoving(null);
          }}
        >
          Bisherige Workouts bleiben unverändert.
        </ConfirmDialog>
      )}
      {confirmClear && (
        <ConfirmDialog
          title="Alle Blöcke entfernen?"
          confirmLabel="Entfernen"
          onCancel={() => setConfirmClear(false)}
          onConfirm={async () => {
            await save([]);
            setConfirmClear(false);
          }}
        >
          Der Plan läuft dann ohne Blöcke weiter. Bisherige Workouts bleiben unverändert.
        </ConfirmDialog>
      )}
    </>
  );
}

function BlockDialog({
  block,
  onChange,
  onClose,
}: {
  block: PlanBlock;
  onChange: (block: PlanBlock) => void;
  onClose: () => void;
}) {
  const defaults = BLOCK_DEFAULTS[block.kind];
  const isDefault =
    block.setsPercent === defaults.setsPercent &&
    block.loadPercent === defaults.loadPercent &&
    block.repShift === defaults.repShift &&
    block.progression === defaults.progression;
  const set = (changes: Partial<PlanBlock>) => onChange({ ...block, ...changes });
  const number =
    (key: 'weeks' | 'setsPercent' | 'loadPercent' | 'repShift') => (value: number | null) => {
      if (value !== null) set({ [key]: value });
    };

  return (
    <Dialog title={`Block: ${BLOCK_KIND_LABELS[block.kind]}`} onClose={onClose}>
      <div>
        <p className="mb-1 text-sm font-medium">Art</p>
        <SegmentedControl
          label="Art"
          options={BLOCK_KINDS.map((value) => ({ value, label: BLOCK_KIND_LABELS[value] }))}
          value={block.kind}
          onChange={(kind) => set({ kind, ...BLOCK_DEFAULTS[kind] })}
        />
        <p className={`${HINT} mt-1`}>{BLOCK_KIND_HINTS[block.kind]}</p>
      </div>
      <Stepper
        label="Dauer"
        value={block.weeks}
        onChange={number('weeks')}
        step={1}
        min={1}
        max={MAX_BLOCK_WEEKS}
        decimals={0}
        unit="Wo."
      />
      <Stepper
        label="Sätze"
        value={block.setsPercent}
        onChange={number('setsPercent')}
        step={10}
        min={MIN_BLOCK_PERCENT}
        max={MAX_BLOCK_PERCENT}
        decimals={0}
        unit="%"
      />
      <Stepper
        label="Gewicht"
        value={block.loadPercent}
        onChange={number('loadPercent')}
        step={5}
        min={MIN_BLOCK_PERCENT}
        max={MAX_BLOCK_PERCENT}
        decimals={0}
        unit="%"
      />
      <Stepper
        label="Wdh. verschieben"
        value={block.repShift}
        onChange={number('repShift')}
        step={1}
        min={-MAX_BLOCK_REP_SHIFT}
        max={MAX_BLOCK_REP_SHIFT}
        decimals={0}
      />
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-emerald-600"
          checked={block.progression}
          onChange={(event) => set({ progression: event.target.checked })}
        />
        Overload-Vorschlag (mehr Gewicht/Wdh.)
      </label>
      <p className={HINT}>
        Prozente beziehen sich auf das letzte normale Training; Deload-, Peak- und Test-Wochen
        zählen dafür nicht.
      </p>
      {!isDefault && (
        <button
          type="button"
          className={secondaryButton}
          onClick={() => set({ ...BLOCK_DEFAULTS[block.kind] })}
        >
          Standard für {BLOCK_KIND_LABELS[block.kind]}
        </button>
      )}
    </Dialog>
  );
}
