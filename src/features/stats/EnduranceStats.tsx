import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { ProgressChart, WeeklyBarChart } from '../../components/charts';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import {
  ENDURANCE_SPORTS,
  type DistanceUnit,
  type EnduranceSession,
  type EnduranceSport,
  type Settings,
} from '../../db/types';
import { dayKey } from '../../domain/daily';
import {
  formatDistance,
  formatSessionCount,
  hasDistance,
  PACE_KINDS,
} from '../../domain/endurance';
import {
  EFFORT_SPORTS,
  formatPaceValue,
  lowerIsFaster,
  pacePoints,
  periodTotals,
  sumHeartRateSeconds,
  weeklyTotals,
} from '../../domain/enduranceStats';
import { formatDecimal } from '../../domain/format';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import { filterByRange, rangeStart, STATS_RANGE_LABELS, STATS_RANGES } from '../../domain/stats';
import { metersToDisplay } from '../../domain/units';
import { formatWorkoutDuration } from '../../domain/workout';
import { BestEffortsCard } from '../endurance/BestEfforts';
import { HeartRateZonesCard } from '../endurance/HeartRateZones';
import { TRAINING_PATH } from '../training/paths';
import { useEnduranceSessions } from '../endurance/useEndurance';
import { useSettings } from '../settings/useSettings';
import { ActivityCard } from './ActivityCard';
import { useStatsFilter } from './statsFilter';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';
const SPORT_NAMES = Object.fromEntries(
  ENDURANCE_SPORTS.map((sport) => [sport, ENDURANCE_SPORT_LABELS[sport].name]),
) as Record<EnduranceSport, string>;

export function EnduranceStats() {
  const sessions = useEnduranceSessions();
  const settings = useSettings();
  const { range, sport, setRange, setSport } = useStatsFilter();
  const from = useFromHere();
  if (!sessions || !settings) return null;
  if (sessions.length === 0) {
    return (
      <Card>
        <p className="text-slate-600 dark:text-slate-400">
          Noch keine Ausdauer-Einheiten. Erfasse oder importiere sie auf der{' '}
          <Link
            to={TRAINING_PATH}
            state={from}
            className="font-semibold text-emerald-700 dark:text-emerald-400"
          >
            Trainingsseite
          </Link>
          .
        </p>
      </Card>
    );
  }
  return (
    <>
      <Card>
        <div className="flex flex-col gap-3">
          <SegmentedControl
            label="Zeitraum"
            options={STATS_RANGES.map((value) => ({ value, label: STATS_RANGE_LABELS[value] }))}
            value={range}
            onChange={setRange}
          />
          <Select
            label="Sportart"
            value={sport}
            options={ENDURANCE_SPORTS}
            labels={SPORT_NAMES}
            emptyLabel="Alle Sportarten"
            onChange={setSport}
          />
        </div>
      </Card>
      <EnduranceContent
        sessions={sport ? sessions.filter((session) => session.sport === sport) : sessions}
        sport={sport}
        range={range}
        settings={settings}
      />
    </>
  );
}

function EnduranceContent({
  sessions,
  sport,
  range,
  settings,
}: {
  sessions: EnduranceSession[];
  sport: EnduranceSport | null;
  range: (typeof STATS_RANGES)[number];
  settings: Settings;
}) {
  const now = useMemo(() => new Date(), []);
  const unit = settings.distanceUnit;
  const ranged = filterByRange(sessions, range, now);
  const withHeartRate = ranged.filter((session) => session.trackSummary?.heartRateSeconds.length);
  const start = rangeStart(range, now);

  return (
    <>
      <TotalsCard sessions={ranged} sport={sport} unit={unit} />
      <ActivityCard sessions={[]} endurance={sessions} now={now} />
      <WeeksCard
        sessions={ranged}
        sport={sport}
        unit={unit}
        from={start ? dayKey(start) : null}
        today={dayKey(now)}
      />
      {sport && PACE_KINDS[sport] ? (
        <PaceCard sessions={ranged} sport={sport} unit={unit} />
      ) : (
        <Card title="Pace-Entwicklung">
          <p className={HINT}>Wähle oben eine Sportart mit Strecke, um die Pace zu sehen.</p>
        </Card>
      )}
      {withHeartRate.length > 0 && (
        <HeartRateZonesCard
          histogram={sumHeartRateSeconds(withHeartRate)}
          settings={settings}
          hint={`Aus ${formatSessionCount(withHeartRate.length)} mit Pulsverlauf.`}
        />
      )}
      {(sport ? [sport] : EFFORT_SPORTS).map((item) => (
        <BestEffortsCard
          key={item}
          sessions={sessions}
          sport={item}
          unit={unit}
          showSport={!sport}
        />
      ))}
    </>
  );
}

function TotalsCard({
  sessions,
  sport,
  unit,
}: {
  sessions: EnduranceSession[];
  sport: EnduranceSport | null;
  unit: DistanceUnit;
}) {
  const totals = periodTotals(sessions);
  const showDistance = sport === null || hasDistance(sport);
  const tiles = [
    { label: 'Einheiten', value: String(totals.count) },
    { label: 'Dauer', value: formatWorkoutDuration(totals.durationSeconds) },
    showDistance && {
      label: 'Strecke',
      value: formatDistance(totals.distanceMeters, sport ?? 'run', unit, 1),
    },
    showDistance &&
      sport !== 'swim' && {
        label: 'Höhenmeter',
        value: `${formatDecimal(totals.elevationGainMeters, 0)} m`,
      },
  ].filter((tile): tile is { label: string; value: string } => Boolean(tile));
  return (
    <Card title="Im Zeitraum">
      <dl data-testid="endurance-totals" className="grid grid-cols-2 gap-3 text-center">
        {tiles.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className={HINT}>{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {sport === null && (
        <p className={`mt-2 ${HINT}`}>Strecke aller Sportarten zusammen (Schwimmen in km).</p>
      )}
    </Card>
  );
}

type WeekMetric = 'distance' | 'duration';

function WeeksCard({
  sessions,
  sport,
  unit,
  from,
  today,
}: {
  sessions: EnduranceSession[];
  sport: EnduranceSport | null;
  unit: DistanceUnit;
  from: string | null;
  today: string;
}) {
  const canDistance = sport === null || hasDistance(sport);
  const [chosen, setMetric] = useState<WeekMetric>('distance');
  const metric = canDistance ? chosen : 'duration';
  const weeks = weeklyTotals(sessions, from, today);
  const swim = sport === 'swim';
  const value = (week: (typeof weeks)[number]) =>
    metric === 'duration'
      ? week.durationSeconds / 3600
      : swim
        ? week.distanceMeters
        : metersToDisplay(week.distanceMeters, unit);
  const distanceUnit = swim ? 'm' : unit;
  return (
    <Card title="Pro Woche">
      {canDistance && (
        <div className="mb-3">
          <SegmentedControl
            label="Kennzahl pro Woche"
            options={[
              { value: 'distance', label: 'Strecke' },
              { value: 'duration', label: 'Dauer' },
            ]}
            value={metric}
            onChange={setMetric}
          />
        </div>
      )}
      {weeks.length === 0 ? (
        <p className={HINT}>Keine Einheiten in diesem Zeitraum.</p>
      ) : (
        <WeeklyBarChart
          label={metric === 'duration' ? 'Dauer pro Woche' : 'Strecke pro Woche'}
          bars={weeks.map((week) => ({
            name: `${week.weekStart.slice(8)}.${week.weekStart.slice(5, 7)}.`,
            value: Math.round(value(week) * 10) / 10,
          }))}
          formatValue={(bar) =>
            metric === 'duration'
              ? formatWorkoutDuration(bar * 3600)
              : `${formatDecimal(bar, swim ? 0 : 1)} ${distanceUnit}`
          }
        />
      )}
    </Card>
  );
}

function PaceCard({
  sessions,
  sport,
  unit,
}: {
  sessions: EnduranceSession[];
  sport: EnduranceSport;
  unit: DistanceUnit;
}) {
  const points = pacePoints(sessions, sport, unit);
  const reversed = lowerIsFaster(sport);
  const format = (value: number) => formatPaceValue(sport, value, unit);
  return (
    <Card title="Pace-Entwicklung">
      {points.length === 0 ? (
        <p className={HINT}>Keine Einheiten mit Strecke in diesem Zeitraum.</p>
      ) : (
        <>
          <ProgressChart
            label={`Pace-Entwicklung ${ENDURANCE_SPORT_LABELS[sport].name}`}
            points={points}
            formatValue={format}
            formatTick={(value) => format(value).split(' ')[0]!}
            reversed={reversed}
          />
          <p className={`mt-2 ${HINT}`}>
            Je Einheit (Dauer durch Strecke), schneller = weiter oben.
          </p>
        </>
      )}
    </Card>
  );
}
