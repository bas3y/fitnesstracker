import { useState, type ReactNode } from 'react';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Icon } from '../../components/icons';
import { CustomizeToggle, Page } from '../../components/Page';
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
import { activityPath, GEAR_PATH, IMPORT_PATH } from '../endurance/paths';
import { useEnduranceSessions, useGearList } from '../endurance/useEndurance';
import { usePlans } from '../plans/usePlans';
import { useSettings } from '../settings/useSettings';
import { HISTORY_PATH, LOG_WORKOUT_PATH, PLANS_PATH } from './paths';
import { TrainingStartCard } from './TrainingStartCard';
import { useActiveExercises } from './useExercises';
import { useNow, useWorkoutHistory } from './useWorkouts';

const MUTED = 'text-sm text-muted';
const MONTH = new Intl.DateTimeFormat('de-DE', { month: 'long' });

/** Trainings-Übersicht: Start oben, darunter Blöcke „Krafttraining“ und „Ausdauer“ als Kacheln */
export function TrainingPage() {
  const settings = useSettings();
  const sessions = useEnduranceSessions();
  const [editing, setEditing] = useState(false);
  const now = useNow(true, 60_000);
  const today = dayKey(now);

  return (
    <Page title="Training" action={<CustomizeToggle editing={editing} onChange={setEditing} />}>
      <TrainingStartCard />
      <StrengthSection today={today} now={now} />
      <section aria-labelledby="endurance-heading" className="mb-4">
        <SectionHeading id="endurance-heading" title="Ausdauer" />
        {settings &&
          sessions &&
          (editing ? (
            <TileEditor tiles={settings.trainingTiles} />
          ) : (
            <ul aria-label="Aktivitäten" className="mb-3 grid grid-cols-2 gap-3">
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
          ))}
        <ul aria-label="Ausdauer-Werkzeuge" className="grid grid-cols-2 gap-3">
          <GearTile />
          <Tile to={IMPORT_PATH} icon="upload" name="Importieren">
            <span className={MUTED}>Sportuhr, Strava</span>
          </Tile>
        </ul>
      </section>
    </Page>
  );
}

function SectionHeading({ id, title, aside }: { id: string; title: string; aside?: ReactNode }) {
  return (
    <div className="mt-2 mb-2 flex items-baseline justify-between gap-2 px-1">
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      {aside}
    </div>
  );
}

function StrengthSection({ today, now }: { today: string; now: Date }) {
  const history = useWorkoutHistory();
  const plans = usePlans();
  const exercises = useActiveExercises();
  const settings = useSettings();
  const workouts = history?.map(({ workout }) => workout);
  const week = workouts && sessionsInRange(workouts, weekRange(today)).length;
  const month = today.slice(0, 7);
  const inMonth = workouts?.filter((workout) =>
    dayKey(new Date(workout.startedAt)).startsWith(month),
  ).length;
  const activePlan = plans?.find(({ plan }) => plan.id === settings?.activePlanId);
  const favorites = exercises?.filter((exercise) => exercise.isFavorite).length;

  return (
    <section aria-labelledby="strength-heading" className="mb-4">
      <SectionHeading
        id="strength-heading"
        title="Krafttraining"
        aside={
          week != null && (
            <span className={MUTED}>
              {week === 1 ? '1 Workout' : `${week} Workouts`} diese Woche
            </span>
          )
        }
      />
      <ul aria-label="Krafttraining" className="grid grid-cols-2 gap-3">
        <Tile to={PLANS_PATH} icon="clipboard" name="Trainingspläne">
          {plans && (
            <span className={`${MUTED} truncate`}>
              {activePlan
                ? `„${activePlan.plan.name}“ aktiv`
                : plans.length === 0
                  ? 'Vorlagen und eigene Pläne'
                  : 'Kein Plan aktiv'}
            </span>
          )}
        </Tile>
        <Tile to={HISTORY_PATH} icon="history" name="Verlauf">
          {inMonth != null && (
            <span className={MUTED}>
              {inMonth === 1 ? '1 Workout' : `${inMonth} Workouts`} im {MONTH.format(now)}
            </span>
          )}
        </Tile>
        <Tile to="/training/exercises" icon="dumbbell" name="Übungen">
          {favorites != null && (
            <span className={MUTED}>
              {favorites === 0
                ? 'Durchsuchen, eigene Übungen'
                : `${favorites} ${favorites === 1 ? 'Favorit' : 'Favoriten'}`}
            </span>
          )}
        </Tile>
        <Tile to={LOG_WORKOUT_PATH} icon="calendarPlus" name="Nachtragen">
          <span className={MUTED}>Von Papier oder früher</span>
        </Tile>
      </ul>
    </section>
  );
}

function GearTile() {
  const gear = useGearList();
  const active = gear?.filter((item) => item.archivedAt === null);
  return (
    <Tile to={GEAR_PATH} icon="shoe" name="Ausrüstung">
      {active && (
        <span className={`${MUTED} truncate`}>
          {active.length === 0
            ? 'Schuhe, Rad, Kilometer'
            : active.length === 1
              ? active[0]!.name
              : `${active.length} Teile in Gebrauch`}
        </span>
      )}
    </Tile>
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
  const label = (sport: EnduranceSport) => ENDURANCE_SPORT_LABELS[sport].name;

  return (
    <div className="mb-4">
      <p className={`mb-3 ${MUTED}`}>Sportarten am Griff ziehen oder mit ✕ ausblenden.</p>
      {tiles.length === 0 && <p className={`mb-3 ${MUTED}`}>Alle Aktivitäten sind ausgeblendet.</p>}
      <SortableList
        label="Kacheln"
        items={tiles.map((sport) => ({ id: sport, name: ENDURANCE_SPORT_LABELS[sport].name }))}
        onReorder={(ids) => updateSettings({ trainingTiles: ids as EnduranceSport[] })}
        renderItem={({ id }, { handle }) => (
          <div className="mb-2 flex min-h-14 items-center rounded-2xl bg-surface">
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
          <h3 className="mb-3 text-lg font-semibold">Weitere Kacheln</h3>
          <ul aria-label="Weitere Kacheln">
            {hidden.map((sport) => (
              <li key={sport} className="mb-2">
                <button
                  type="button"
                  aria-label={`${ENDURANCE_SPORT_LABELS[sport].name} hinzufügen`}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left active:bg-pressed"
                  onClick={() =>
                    void change((current) =>
                      current.includes(sport) ? current : [...current, sport],
                    )
                  }
                >
                  <Icon name="plus" className="h-5 w-5 text-primary-text" />
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
