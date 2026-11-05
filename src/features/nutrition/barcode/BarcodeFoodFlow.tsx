import { useCallback, useEffect, useRef, useState } from 'react';
import { primaryButton, secondaryButton } from '../../../components/buttons';
import { Card } from '../../../components/Page';
import { useOnline } from '../../../components/useOnline';
import { createUserFood, findFoodByBarcode } from '../../../db/foods';
import { EMPTY_FOOD_INPUT, type FoodInput } from '../../../db/schemas';
import type { Food } from '../../../db/types';
import { formatBarcode } from '../../../domain/barcode';
import { OFF_SOURCE_PREFIX } from '../../../domain/openFoodFacts';
import { FoodForm } from '../FoodForm';
import { BarcodeScanner } from './BarcodeScanner';
import { fetchOffProduct, OffRequestError } from './openFoodFacts';

const NOTE = 'mb-4 rounded-xl px-4 py-3 text-sm font-medium';
const INFO = `${NOTE} bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-200`;
const WARN = `${NOTE} bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200`;

type Lookup =
  | { state: 'local' }
  | { state: 'offline' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'form'; input: FoodInput; fromOff: boolean; note: string };

/**
 * Strichcode scannen oder eintippen → gespeichertes Lebensmittel (ohne Internet) oder Werte von
 * Open Food Facts (nur online) → prüfen und als eigenes Lebensmittel speichern.
 */
export function BarcodeFoodFlow({
  submitLabel,
  onFood,
  onCancel,
}: {
  submitLabel: string;
  onFood: (food: Food) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [lookup, setLookup] = useState<Lookup>({ state: 'local' });
  const [attempt, setAttempt] = useState(0);
  const online = useOnline();
  const found = useRef(onFood);
  useEffect(() => {
    found.current = onFood;
  }, [onFood]);

  const manualForm = useCallback(
    (barcode: string, note: string): Lookup => ({
      state: 'form',
      input: { ...EMPTY_FOOD_INPUT, barcode },
      fromOff: false,
      note,
    }),
    [],
  );

  // 1. lokal suchen, 2. Open Food Facts (nur online, erneut bei `attempt`)
  useEffect(() => {
    if (!code) return;
    const controller = new AbortController();
    void (async () => {
      const saved = await findFoodByBarcode(code);
      if (controller.signal.aborted) return;
      if (saved) {
        found.current(saved);
        return;
      }
      if (!navigator.onLine) {
        setLookup({ state: 'offline' });
        return;
      }
      setLookup({ state: 'loading' });
      try {
        const result = await fetchOffProduct(code, controller.signal);
        if (controller.signal.aborted) return;
        if (result.status === 'not-found') {
          setLookup(
            manualForm(
              code,
              'Bei Open Food Facts nicht gefunden. Werte von der Verpackung eintragen.',
            ),
          );
          return;
        }
        setLookup({
          state: 'form',
          input: { ...result.input, barcode: code },
          fromOff: true,
          note: result.hasNutrients
            ? 'Werte von Open Food Facts – bitte mit der Verpackung vergleichen.'
            : 'Bei Open Food Facts gefunden, aber ohne Nährwerte. Bitte von der Verpackung ergänzen.',
        });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setLookup({
          state: 'error',
          message: cause instanceof OffRequestError ? cause.message : 'Abfrage fehlgeschlagen.',
        });
      }
    })();
    return () => controller.abort();
  }, [code, attempt, manualForm]);

  if (!code) return <BarcodeScanner onDetected={setCode} />;

  const rescan = () => {
    setCode(null);
    setLookup({ state: 'local' });
  };
  const codeLine = (
    <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
      Strichcode <span className="font-medium tabular-nums">{formatBarcode(code)}</span>
    </p>
  );

  if (lookup.state === 'form') {
    return (
      <>
        {codeLine}
        <p role="status" className={lookup.fromOff ? INFO : WARN}>
          {lookup.note}
        </p>
        <FoodForm
          key={`${code}-${lookup.fromOff}`}
          initial={lookup.input}
          submitLabel={submitLabel}
          onSubmit={async (values) => {
            const food = await createUserFood(values, {
              sourceRef: lookup.fromOff ? `${OFF_SOURCE_PREFIX}${code}` : null,
            });
            onFood(food);
          }}
          onCancel={onCancel}
        />
      </>
    );
  }

  return (
    <>
      {codeLine}
      {lookup.state === 'local' || lookup.state === 'loading' ? (
        <p role="status" className={INFO}>
          {lookup.state === 'local' ? 'Suche …' : 'Suche bei Open Food Facts …'}
        </p>
      ) : (
        <Card>
          <p role="status" className="mb-4">
            {lookup.state === 'offline'
              ? 'Dieser Strichcode ist noch nicht gespeichert. Die Suche bei Open Food Facts geht nur mit Internet.'
              : lookup.message}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className={primaryButton}
              disabled={!online}
              onClick={() => setAttempt((value) => value + 1)}
            >
              {online ? 'Bei Open Food Facts suchen' : 'Nur mit Internet'}
            </button>
            <button
              type="button"
              className={secondaryButton}
              onClick={() => setLookup(manualForm(code, 'Werte von der Verpackung eintragen.'))}
            >
              Selbst eintragen
            </button>
          </div>
        </Card>
      )}
      <button type="button" className={`${secondaryButton} mt-4`} onClick={rescan}>
        Anderen Strichcode scannen
      </button>
    </>
  );
}
