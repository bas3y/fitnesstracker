import { expect, test, type Page } from '@playwright/test';
import { addExercise, confirmStart, fillStepper, goOffline, skipRest } from './helpers';

const DAY_MS = 24 * 60 * 60 * 1000;
const REST_MS = 120_000;

/** Abstände so gewählt, dass die Grenze von „4 Wochen“ nie auf eine Einheit fällt */
const SESSION_DAYS_AGO = [49, 42, 35, 30, 21, 14, 7, 0];

function statsBackup() {
  const now = Date.now();
  const iso = (time: number) => new Date(time).toISOString();
  const entity = (id: string) => ({
    id,
    createdAt: iso(now),
    updatedAt: iso(now),
    deletedAt: null,
  });
  const exercise = (id: string, name: string, primary: string, secondary: string[]) => ({
    ...entity(id),
    source: 'user',
    builtinKey: null,
    name,
    aliases: [],
    category: 'strength',
    primaryMuscles: [primary],
    secondaryMuscles: secondary,
    equipment: 'barbell',
    isUnilateral: false,
    isTimed: false,
    isFavorite: false,
    hiddenAt: null,
    notes: '',
    loadType: 'weight',
  });

  const workouts: unknown[] = [];
  const workoutExercises: unknown[] = [];
  const sets: unknown[] = [];
  const addItem = (
    workoutId: string,
    exerciseId: string,
    start: number,
    weight: number,
    repsPerSet: number[],
  ) => {
    const itemId = `${workoutId}-${exerciseId}`;
    workoutExercises.push({
      ...entity(itemId),
      workoutId,
      exerciseId,
      order: 0,
    });
    repsPerSet.forEach((reps, index) =>
      sets.push({
        ...entity(`${itemId}-${index}`),
        workoutId,
        workoutExerciseId: itemId,
        order: index,
        weight,
        level: null,
        eccentricWeight: null,
        eccentricLevel: null,
        reps,
        durationSeconds: null,
        rpe: null,
        rir: null,
        isWarmup: false,
        restSeconds: null,
        completedAt: iso(start + index * REST_MS),
      }),
    );
  };

  SESSION_DAYS_AGO.forEach((days, index) => {
    const id = `w${index}`;
    const start = now - days * DAY_MS - 30 * 60_000;
    workouts.push({
      ...entity(id),
      startedAt: iso(start),
      endedAt: iso(start + 20 * 60_000),
      notes: '',
      restEndsAt: null,
      planId: null,
      planDayId: null,
    });
    addItem(id, 'bench', start, 80 + 2.5 * index, [6, 6, 5]);
    if (index >= 4) addItem(id, 'curl', start + 10 * 60_000, 20, [8, 8]);
  });

  return {
    app: 'fitnesstracker',
    backupVersion: 1,
    dbVersion: 10,
    exportedAt: iso(now),
    tables: {
      settings: [
        {
          ...entity('app-settings'),
          name: '',
          weightUnit: 'kg',
          distanceUnit: 'km',
          bodyWeightKg: null,
          theme: 'system',
          lastBackupAt: iso(now),
          seedVersion: 0,
        },
      ],
      exercises: [
        exercise('bench', 'Test-Bankdrücken', 'chest', ['triceps']),
        exercise('curl', 'Test-Curl', 'biceps', []),
      ],
      workouts,
      workoutExercises,
      sets,
    },
  };
}

async function importStatsData(page: Page) {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'statistik.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(statsBackup())),
  });
  await page.getByRole('button', { name: 'Importieren', exact: true }).click();
  await expect(page.getByText('Sicherung wurde importiert')).toBeVisible();
}

/** Der Haken folgt erst der gespeicherten Einstellung, check() prüft zu früh */
async function toggle(page: Page, name: string, checked: boolean) {
  const box = page.getByRole('checkbox', { name });
  await box.click();
  await expect(box).toBeChecked({ checked });
}

const openNav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Hauptnavigation' }).getByText(name).click();

test('Statistik: Filter, Fortschritt, Verlauf und Pausen-Auswertung (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/settings');
  await goOffline(page, context);
  await importStatsData(page);

  await openNav(page, 'Statistik');
  await expect(page.getByRole('heading', { name: 'Statistik' })).toBeVisible();

  // Fortschritt und Fokus: 82,5 → 97,5 kg als 1RM-Vergleich der ersten und letzten zwei Einheiten
  const progress = page.getByRole('list', { name: 'Fortschritt je Muskelgruppe' });
  await expect(progress.getByRole('listitem').first()).toContainText('Brust (1 Übung)');
  await expect(progress.getByRole('listitem').first()).toContainText('+18,2 %');
  await expect(progress).toContainText('Bizeps (1 Übung)');
  await expect(page.getByText('Schultern: vernachlässigt, mehr Sätze einplanen')).toBeVisible();

  // Hilfsmuskeln zählen halb: Trizeps hat die Hälfte der Brust-Sätze
  const volumes = page.getByRole('list', { name: 'Sätze pro Muskelgruppe' });
  await expect(volumes.getByRole('listitem').first()).toContainText('Brust');
  await expect(volumes).toContainText('Trizeps');

  // Heatmap startet bei heute und zeigt den angetippten Tag
  const heatmap = page.getByTestId('heatmap');
  await expect
    .poll(() =>
      heatmap.evaluate((element) =>
        Math.round(element.scrollLeft + element.clientWidth - element.scrollWidth),
      ),
    )
    .toBe(0);
  const trainedDays = heatmap.getByRole('button', { name: /: 5 Sätze$/ });
  await expect(trainedDays).toHaveCount(4);
  await trainedDays.last().click();
  await expect(page.getByRole('link', { name: 'Workout öffnen' })).toBeVisible();
  await expect(page.getByText('8 Trainingstage')).toHaveCount(0);

  // Filter Muskelgruppe
  await page.getByLabel('Muskelgruppe', { exact: true }).selectOption('chest');
  await expect(page).toHaveURL(/muscle=chest/);
  await expect(page.getByRole('heading', { name: 'Sätze pro Woche: Brust' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Sätze pro Woche für Brust' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Test-Curl/ })).toHaveCount(0);
  await expect(heatmap.getByRole('button', { name: /: 5 Sätze$/ })).toHaveCount(0);
  await expect(heatmap.getByRole('button', { name: /: 3 Sätze$/ })).toHaveCount(8);

  // Verlauf der Übung
  await page.getByRole('link', { name: /Test-Bankdrücken/ }).click();
  await expect(page.getByRole('heading', { name: 'Test-Bankdrücken' })).toBeVisible();
  const chart = page.getByRole('img', { name: /im Verlauf/ });
  await expect(chart.locator('.recharts-line-dots circle')).toHaveCount(8);
  await expect(page.getByTestId('history-summary')).toHaveText('80 kg → 97,5 kg (+21,9 %)');

  const metrics = page.getByRole('group', { name: 'Kennzahl' });
  await metrics.getByRole('button', { name: '1RM' }).click();
  await expect(page.getByTestId('history-summary')).toHaveText('96 kg → 117 kg (+21,9 %)');
  await metrics.getByRole('button', { name: 'Volumen' }).click();
  await expect(page.getByTestId('history-summary')).toContainText('1360 kg → 1658 kg');

  const bests = page.getByRole('list', { name: 'Bestwerte' });
  await expect(bests.getByRole('listitem').first()).toContainText('Gewicht');
  await expect(bests.getByRole('listitem').first()).toContainText('97,5 kg');

  // Zeitraum: die Einheit vor 30 Tagen fällt bei „4 Wochen“ weg
  await page.getByRole('button', { name: '4 Wo.' }).click();
  await expect(chart.locator('.recharts-line-dots circle')).toHaveCount(4);

  // Zurück: Filter bleiben erhalten
  await page.getByRole('link', { name: 'Zurück', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Statistik' })).toBeVisible();
  await expect(page.getByLabel('Muskelgruppe', { exact: true })).toHaveValue('chest');
  await expect(page.getByRole('button', { name: '4 Wo.' })).toHaveAttribute('aria-pressed', 'true');

  // Pausen-Auswertung ist ein erweiterter Modus und standardmäßig aus
  await expect(page.getByRole('heading', { name: 'Satzpausen' })).toHaveCount(0);
  await openNav(page, 'Einstellungen');
  await toggle(page, 'Pausen-Auswertung', true);
  await openNav(page, 'Statistik');
  await page.getByRole('button', { name: 'Alles' }).click();
  await expect(page.getByRole('heading', { name: 'Satzpausen' })).toBeVisible();
  const rest = page.locator('section').filter({ hasText: 'Satzpausen' });
  await expect(rest).toContainText('Test-Bankdrücken');
  await expect(rest).toContainText('Deine Pausenlänge passt.');
  await rest.getByRole('link', { name: /Test-Bankdrücken/ }).click();
  await expect(page.getByRole('cell', { name: '1:30–2:30' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '16', exact: true })).toBeVisible();
});

test('Statistik ohne Trainings zeigt einen Hinweis', async ({ page }) => {
  await page.goto('./#/stats');
  await expect(page.getByText('Noch keine beendeten Trainings.')).toBeVisible();
});

test('Pausen-Timer lässt sich ausschalten, auch während einer Pause (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/training');
  await goOffline(page, context);
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);
  const bench = await addExercise(page, 'Bankdrücken (Langhantel)');
  await fillStepper(bench, 'Gewicht', '60');
  await fillStepper(bench, 'Wiederholungen', '8');
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  const timer = page.getByRole('timer', { name: 'Pause' });
  await expect(timer).toBeVisible();

  await openNav(page, 'Einstellungen');
  await toggle(page, 'Pausen-Timer', false);
  await expect(page.getByLabel('Pausenzeit nach einem Satz')).toHaveCount(0);

  const banner = page.getByRole('status').filter({ hasText: 'Workout läuft' });
  await expect(banner).not.toContainText('Pause');
  await banner.click();
  await expect(timer).toHaveCount(0);
  await bench.getByRole('button', { name: '+ Satz' }).click();
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await expect(bench.getByRole('button', { name: 'Satz 2 abhaken' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(timer).toHaveCount(0);

  await openNav(page, 'Einstellungen');
  await toggle(page, 'Pausen-Timer', true);
  await banner.click();
  await bench.getByRole('button', { name: '+ Satz' }).click();
  await bench.getByRole('button', { name: 'Satz abhaken' }).click();
  await skipRest(page);
});

test('Favorit in der Übungssuche setzen, ohne die Auswahl zu verlassen (offline)', async ({
  page,
  context,
}) => {
  await page.goto('./#/training');
  await goOffline(page, context);
  await page.getByRole('button', { name: 'Workout starten' }).click();
  await confirmStart(page);

  await page.getByRole('button', { name: '+ Übung hinzufügen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Übung hinzufügen' });
  await dialog.getByRole('searchbox', { name: 'Übung suchen' }).fill('Bankdrücken (Langhantel)');
  const star = dialog.getByRole('button', { name: 'Favorit: Bankdrücken (Langhantel)' });
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: /^Bankdrücken \(Langhantel\)/ }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Bankdrücken (Langhantel)' })).toBeVisible();
});
