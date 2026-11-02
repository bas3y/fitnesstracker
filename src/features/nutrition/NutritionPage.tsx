import { LinkRow, Page } from '../../components/Page';
import { MEAL_TYPES } from '../../db/types';
import { nutritionDay } from '../../domain/nutrition';
import { DayNavigator } from '../daily/DayNavigator';
import { useDayBackTo, useDayParam } from '../daily/useDaily';
import { useSettings } from '../settings/useSettings';
import { MealCard } from './MealCard';
import { NutritionSummary } from './NutritionSummary';
import { FOODS_PATH } from './paths';
import { useNutritionDay } from './useNutrition';

export function NutritionPage() {
  const settings = useSettings();
  const { date, today, setDate } = useDayParam();
  const data = useNutritionDay(date);
  const backTo = useDayBackTo(date, today);
  const day = data && nutritionDay(data.entries);

  return (
    <Page title="Ernährung" backTo={backTo}>
      <DayNavigator date={date} today={today} onChange={setDate} />
      {settings && data && <NutritionSummary data={data} settings={settings} title="Übersicht" />}
      {data &&
        day &&
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
      <LinkRow
        to={FOODS_PATH}
        label="Lebensmittel & Rezepte"
        hint="Eigene anlegen, Favoriten, ausblenden"
      />
    </Page>
  );
}
