import type { ReactNode } from 'react';
import { Card, Page } from '../../components/Page';
import { SEED_VERSION } from '../../db/seed';

export function AboutPage() {
  return (
    <Page title="Über & Lizenzen" backTo="/settings">
      <Card title="Fitnesstracker">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Offline-App für Training und Alltag. Alle Daten bleiben auf diesem Gerät – es gibt keinen
          Server und kein Konto. Stand der mitgelieferten Daten: Version {SEED_VERSION}.
        </p>
      </Card>

      <Card title="Datenquellen">
        <dl className="flex flex-col gap-4 text-sm">
          <Source
            name="Übungen"
            origin={
              <>
                Auswahl aus{' '}
                <Ext href="https://github.com/yuhonas/free-exercise-db">free-exercise-db</Ext>{' '}
                (Unlicense, gemeinfrei), ins Deutsche übersetzt und um einige gängige Übungen
                ergänzt.
              </>
            }
          />
          <Source
            name="Lebensmittel"
            origin={
              <>
                Nährwerte aus <Ext href="https://fdc.nal.usda.gov/">USDA FoodData Central</Ext>,
                Datensatz „SR Legacy“ (U.S. Department of Agriculture, Agricultural Research
                Service; gemeinfrei, CC0 1.0). Namen, Portionen und Kategorien sind eigene
                Ergänzungen. Kohlenhydrate sind wie in der EU üblich ohne Ballaststoffe angegeben.
              </>
            }
          />
          <Source
            name="Ergänzte Lebensmittel"
            origin="Einige in Deutschland übliche Produkte (z. B. Magerquark, Skyr, Haferdrink) fehlen in der USDA-Datenbank. Dafür sind typische Durchschnittswerte gängiger Handelsprodukte hinterlegt."
          />
        </dl>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Alle Nährwerte sind Richtwerte und können je nach Produkt abweichen.
        </p>
      </Card>

      <Card title="Software">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Gebaut mit React, React Router, Dexie, Zod, Tailwind CSS und Workbox (jeweils MIT- bzw.
          Apache-2.0-Lizenz).
        </p>
      </Card>
    </Page>
  );
}

function Source({ name, origin }: { name: string; origin: ReactNode }) {
  return (
    <div>
      <dt className="font-semibold">{name}</dt>
      <dd className="text-slate-600 dark:text-slate-400">{origin}</dd>
    </div>
  );
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-emerald-700 underline dark:text-emerald-400"
    >
      {children}
    </a>
  );
}
