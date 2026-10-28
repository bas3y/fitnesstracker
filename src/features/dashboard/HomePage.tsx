import { Card } from '../../components/Page';
import { useSettings } from '../settings/useSettings';

export function HomePage() {
  const settings = useSettings();

  return (
    <div className="mx-auto max-w-md px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="mb-4 flex items-center gap-3">
        <img src="./favicon.svg" alt="" className="h-12 w-12" />
        <div>
          <h1 className="text-2xl font-bold">Fitnesstracker</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {settings?.name ? `Hallo, ${settings.name}!` : 'Hallo!'}
          </p>
        </div>
      </div>
      <Card>
        <p className="text-slate-600 dark:text-slate-400">
          Hier entsteht dein Dashboard mit Training, Alltag und Fortschritt.
        </p>
      </Card>
    </div>
  );
}
