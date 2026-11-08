import type { ReactNode } from 'react';
import { Card, Page } from '../../components/Page';
import { BaseyLogo } from '../../components/BaseyLogo';
import { BaseyWordmark } from '../../components/BaseyWordmark';
import { SEED_VERSION } from '../../db/seed';
import { useSettings } from './useSettings';

export function AboutPage() {
  const settings = useSettings();
  return (
    <Page title="Über & Lizenzen" backTo="/settings">
      <Card>
        <div className="mb-3 flex items-center gap-4">
          <BaseyLogo variant={settings?.logoVariant} className="h-16 w-16" />
          <BaseyWordmark tagline className="w-32" />
        </div>
        <p className="text-sm text-muted">
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
        <p className="mt-4 text-xs text-muted">
          Alle Nährwerte sind Richtwerte und können je nach Produkt abweichen.
        </p>
      </Card>

      <Card title="Software">
        <p className="text-sm text-muted">
          Gebaut mit React, React Router, Dexie, Zod, Tailwind CSS und Workbox (jeweils MIT- bzw.
          Apache-2.0-Lizenz). Schriftzug „Basey“ aus der Schrift Inter Tight (SIL Open Font
          License).
        </p>
      </Card>
    </Page>
  );
}

function Source({ name, origin }: { name: string; origin: ReactNode }) {
  return (
    <div>
      <dt className="font-semibold">{name}</dt>
      <dd className="text-muted">{origin}</dd>
    </div>
  );
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-primary-text underline"
    >
      {children}
    </a>
  );
}
