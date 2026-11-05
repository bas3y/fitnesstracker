import { Card, LinkRow, Page } from '../../components/Page';
import { MEAL_TYPES } from '../../db/types';
import { nutritionDay } from '../../domain/nutrition';
import { DayNavigator } from '../daily/DayNavigator';
import { useDayBackTo, useDayParam } from '../daily/useDaily';
import { useSettings } from '../settings/useSettings';
import { MealCard } from './MealCard';
import { NutritionSummary } from './NutritionSummary';
import { FOODS_PATH } from './paths';
import { ProteinQuickAdd } from './ProteinQuickAdd';
import { useNutritionDay } from './useNutrition';

export function NutritionPage() {
  const settings = useSettings();
  const { date, today, setDate } = useDayParam();
  const data = useNutritionDay(date);
  const backTo = useDayBackTo(date, today);
  const day = data && nutritionDay(data.entries);
  const proteinOnly = settings?.proteinOnly ?? false;

  return (
    <Page title="Ernährung" backTo={backTo}>
      <DayNavigator date={date} today={today} onChange={setDate} />
      {settings && data && <NutritionSummary data={data} settings={settings} title="Übersicht" />}
      {data && proteinOnly && (
        <>
          <Card title="Protein eintragen">
            <ProteinQuickAdd key={date} date={date} grams={data.quickProteinGrams} />
          </Card>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Du erfasst nur Protein. Mahlzeiten mit Kalorien und Lebensmitteln schaltest du unter
            Einstellungen → Ernährung wieder ein.
          </p>
        </>
      )}
      {data &&
        day &&
        !proteinOnly &&
        MEAL_TYPES.map((meal) => (
          <MealCard
            key={meal}
            meal={meal}
            date={date}
            today={today}
            summary={day.meals[meal]}
            previousCount={data.previous.filter((entry) => entry.meal === meal).length}
          />
        ))}
      {data && settings && !proteinOnly && (
        <Card title="Protein schnell eintragen">
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Ohne Lebensmittel, z. B. ein Shake: zählt zum Protein des Tages, nicht zu den Kalorien.
          </p>
          <ProteinQuickAdd key={date} date={date} grams={data.quickProteinGrams} />
        </Card>
      )}
      {!proteinOnly && (
        <LinkRow
          to={FOODS_PATH}
          label="Lebensmittel & Rezepte"
          hint="Eigene anlegen, Favoriten, ausblenden"
        />
      )}
    </Page>
  );
}
