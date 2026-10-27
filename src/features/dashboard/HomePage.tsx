export function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <img src="./favicon.svg" alt="" className="h-20 w-20" />
      <h1 className="text-3xl font-bold">Fitnesstracker</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Dein Offline-Tracker für Training, Alltag und Ernährung. Hier entsteht bald dein Dashboard.
      </p>
    </main>
  );
}
