import { useState } from 'react';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { LinkRow, Page } from '../../components/Page';
import { SortableList } from '../../components/SortableList';
import { Tile } from '../../components/Tile';
import { updateSettings, updateSettingsFrom } from '../../db/settings';
import {
  ENDURANCE_SPORTS,
  type DistanceUnit,
  type EnduranceSession,
  type EnduranceSport,
} from '../../db/types';
import { dayKey } from '../../domain/daily';
import {
  formatSessionCount,
  formatTotals,
  sessionsInRange,
  sportWeekTotals,
  weekRange,
} from '../../domain/endurance';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import { activityPath, GEAR_PATH } from '../endurance/paths';
import { useEnduranceSessions } from '../endurance/useEndurance';
import { useSettings } from '../settings/useSettings';
import { HISTORY_PATH, PLANS_PATH } from './paths';
import { TrainingStartCard } from './TrainingStartCard';
import { useNow, useWorkoutHistory } from './useWorkouts';

const MUTED = 'text-sm text-slate-500 dark:text-slate-400';

/** Trainings-Übersicht: Krafttraining oben, darunter je Aktivität eine Kachel mit Wochenstand */
export function TrainingPage() {
  const settings = useSettings();
  const sessions = useEnduranceSessions();
  const [editing, setEditing] = useState(false);
  const today = dayKey(useNow(true, 60_000));

  return (
    <Page
      title="Training"
      action={
        <button
          type="button"
          className="min-h-11 shrink-0 rounded-xl border border-slate-300 px-3 text-sm font-semibold dark:border-slate-600"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Fertig' : 'Anpassen'}
        </button>
      }
    >
      <StrengthSection today={today} />
      {settings &&
        sessions &&
        (editing ? (
          <TileEditor tiles={settings.trainingTiles} />
        ) : (
          settings.trainingTiles.length > 0 && (
            <ul aria-label="Aktivitäten" className="mb-4 grid grid-cols-2 gap-3">
              {settings.trainingTiles.map((sport) => (
                <ActivityTile
                  key={sport}
                  sport={sport}
                  sessions={sessions}
                  today={today}
                  unit={settings.distanceUnit}
                />
              ))}
            </ul>
          )
        ))}
      <LinkRow to={PLANS_PATH} label="Trainingspläne" hint="Vorlagen, eigene Pläne, aktiver Plan" />
      <LinkRow to={HISTORY_PATH} label="Verlauf" hint="Beendete Workouts ansehen und bearbeiten" />
      <LinkRow
        to="/training/exercises"
        label="Übungen"
        hint="Durchsuchen, Favoriten, eigene Übungen"
      />
      <LinkRow to={GEAR_PATH} label="Ausrüstung" hint="Schuhe, Rad, Kilometerstand" />
    </Page>
  );
}

function StrengthSection({ today }: { today: string }) {
  const history = useWorkoutHistory();
  const week =
    history &&
    sessionsInRange(
      history.map(({ workout }) => workout),
      weekRange(today),
    ).length;
  return (
    <section aria-labelledby="strength-heading">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="strength-heading" className="text-lg font-semibold">
          🏋️ Krafttraining
        </h2>
        {week != null && (
          <span className={MUTED}>{week === 1 ? '1 Workout' : `${week} Workouts`} diese Woche</span>
        )}
      </div>
      <TrainingStartCard />
    </section>
  );
}

function ActivityTile({
  sport,
  sessions,
  today,
  unit,
}: {
  sport: EnduranceSport;
  sessions: EnduranceSession[];
  today: string;
  unit: DistanceUnit;
}) {
  const { name, icon } = ENDURANCE_SPORT_LABELS[sport];
  const totals = sportWeekTotals(sessions, sport, today);
  return (
    <Tile to={activityPath(sport)} icon={icon} name={name}>
      {totals.count === 0 ? (
        <span className={MUTED}>Diese Woche noch nichts</span>
      ) : (
        <>
          <span className={`tabular-nums ${MUTED}`}>
            {formatTotals(totals, sport, unit)} diese Woche
          </span>
          <span className={MUTED}>{formatSessionCount(totals.count)}</span>
        </>
      )}
    </Tile>
  );
}

/** Kacheln sortieren, ausblenden und wieder hinzufügen (wie die Widgets der Startseite) */
function TileEditor({ tiles }: { tiles: EnduranceSport[] }) {
  const change = (next: (current: EnduranceSport[]) => EnduranceSport[]) =>
    updateSettingsFrom((current) => ({ trainingTiles: next(current.trainingTiles) }));
  const hidden = ENDURANCE_SPORTS.filter((sport) => !tiles.includes(sport));
  const label = (sport: EnduranceSport) =>
    `${ENDURANCE_SPORT_LABELS[sport].icon} ${ENDURANCE_SPORT_LABELS[sport].name}`;

  return (
    <div className="mb-4">
      <p className={`mb-3 ${MUTED}`}>
        Krafttraining bleibt immer oben. Kacheln am Griff ziehen oder mit ✕ ausblenden.
      </p>
      {tiles.length === 0 && <p className={`mb-3 ${MUTED}`}>Alle Aktivitäten sind ausgeblendet.</p>}
      <SortableList
        label="Kacheln"
        items={tiles.map((sport) => ({ id: sport, name: ENDURANCE_SPORT_LABELS[sport].name }))}
        onReorder={(ids) => updateSettings({ trainingTiles: ids as EnduranceSport[] })}
        renderItem={({ id }, { handle }) => (
          <div className="mb-2 flex min-h-14 items-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
            {handle ?? <span className="w-3 shrink-0" />}
            <span className="min-w-0 flex-1 px-1 font-medium">{label(id as EnduranceSport)}</span>
            <DeleteRowButton
              name={ENDURANCE_SPORT_LABELS[id as EnduranceSport].name}
              verb="ausblenden"
              onClick={() => void change((current) => current.filter((sport) => sport !== id))}
            />
          </div>
        )}
      />
      {hidden.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-3 text-lg font-semibold">Weitere Kacheln</h2>
          <ul aria-label="Weitere Kacheln">
            {hidden.map((sport) => (
              <li key={sport} className="mb-2">
                <button
                  type="button"
                  aria-label={`${ENDURANCE_SPORT_LABELS[sport].name} hinzufügen`}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-sm active:bg-slate-50 dark:bg-slate-800 dark:active:bg-slate-700"
                  onClick={() =>
                    void change((current) =>
                      current.includes(sport) ? current : [...current, sport],
                    )
                  }
                >
                  <span
                    aria-hidden="true"
                    className="text-xl text-emerald-700 dark:text-emerald-400"
                  >
                    +
                  </span>
                  <span className="font-medium">{label(sport)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
