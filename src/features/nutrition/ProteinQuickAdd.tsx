import { useState } from 'react';
import { secondaryButton } from '../../components/buttons';
import { Stepper } from '../../components/Stepper';
import { addProtein, updateDailyLog } from '../../db/daily';
import { MAX_QUICK_PROTEIN_G } from '../../db/schemas';
import type { DayKey } from '../../db/types';
import { formatGrams } from '../../domain/nutrition';

const PROTEIN_STEPS_G = [10, 20, 30] as const;

/**
 * Protein ohne Lebensmittel eintragen (z. B. Shake): Buttons wie beim Wasser, „Rückgängig“ für
 * den letzten Button, optional die Summe zum Korrigieren
 */
export function ProteinQuickAdd({
  date,
  grams,
  withTotal = true,
}: {
  date: DayKey;
  /** Bisher schnell erfasst */
  grams: number;
  withTotal?: boolean;
}) {
  const [last, setLast] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Protein hinzufügen" className="flex gap-2">
        {PROTEIN_STEPS_G.map((step) => (
          <button
            key={step}
            type="button"
            aria-label={`+${step} g Protein`}
            className={secondaryButton}
            onClick={() => {
              setLast(step);
              void addProtein(date, step);
            }}
          >
            +{step} g
          </button>
        ))}
      </div>
      {last !== null && (
        <button
          type="button"
          className="min-h-11 self-start text-sm font-medium text-emerald-700 dark:text-emerald-400"
          onClick={() => {
            setLast(null);
            void addProtein(date, -last);
          }}
        >
          Rückgängig (−{formatGrams(last)})
        </button>
      )}
      {withTotal && (
        <Stepper
          label="Protein ohne Lebensmittel"
          value={grams}
          unit="g"
          step={5}
          max={MAX_QUICK_PROTEIN_G}
          decimals={0}
          onChange={(value) => {
            setLast(null);
            if (value !== null) void updateDailyLog(date, { proteinGrams: value });
          }}
        />
      )}
    </div>
  );
}
