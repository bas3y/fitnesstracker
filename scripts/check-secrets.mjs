// Sucht nach Geheimnissen (Schlüssel, Tokens, Passwörter), bevor sie ins Repo gelangen.
//   node scripts/check-secrets.mjs --staged   vorgemerkte Änderungen (Git-Hook pre-commit)
//   node scripts/check-secrets.mjs --all      alle Dateien im Repo (CI)
// Falscher Treffer: Zeile mit dem Kommentar `secret-scan: ignore` versehen.
import { execFileSync } from 'node:child_process';

const PATTERNS = [
  ['Privater Schlüssel', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['GitHub-Token', /\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['AWS-Schlüssel', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['Stripe-Schlüssel', /\b[rs]k_(live|test)_[A-Za-z0-9]{20,}\b/],
  ['Slack-Token', /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/],
  ['Google-API-Schlüssel', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Anthropic/OpenAI-Schlüssel', /\bsk-(ant-)?[A-Za-z0-9_-]{32,}\b/],
  ['Sentry-Auth-Token', /\bsntry[su]_[A-Za-z0-9+/=_-]{30,}/],
  ['Supabase-Secret-Key', /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
  [
    'JWT (z. B. Supabase service_role)',
    /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  ],
  [
    'Datenbank-URL mit Passwort',
    /\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis):\/\/[^:\s/]+:[^@\s]+@/,
  ],
  [
    'Zuweisung eines Geheimnisses',
    /\b(api[_-]?key|secret|token|passw(or)?d|service[_-]?role[_-]?key|auth[_-]?token)\b["']?\s*[:=]\s*["'][^"'\s]{12,}["']/i,
  ],
];

/** Dateien, die nie eingecheckt werden dürfen (außer der Vorlage) */
const FORBIDDEN_FILE = /(^|\/)(\.env(\..+)?|.*\.(pem|key|p12|pfx)|id_(rsa|ed25519|ecdsa))$/i;
const ALLOWED_FILE = /(^|\/)\.env\.example$/;
/** Nicht durchsuchen: Lockfile (Prüfsummen), Binärdateien, Datentabellen, dieses Skript */
const SKIP =
  /(^|\/)(package-lock\.json|scripts\/check-secrets\.mjs)$|\.(png|jpe?g|webp|ico|gif|pdf|woff2?|fit|gz|zip)$|^src\/data\//i;
const MAX_BYTES = 2 * 1024 * 1024;

const git = (...args) =>
  execFileSync('git', args, { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 });

const mode = process.argv[2] ?? '--staged';
if (mode !== '--staged' && mode !== '--all') {
  console.error('Aufruf: node scripts/check-secrets.mjs --staged | --all');
  process.exit(2);
}

const files = (
  mode === '--staged'
    ? git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z')
    : git('ls-files', '-z')
)
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

const findings = [];
for (const file of files) {
  if (FORBIDDEN_FILE.test(file) && !ALLOWED_FILE.test(file)) {
    findings.push(`${file}: Datei mit Zugangsdaten darf nicht ins Repo`);
    continue;
  }
  if (SKIP.test(file)) continue;
  // Bei --staged den vorgemerkten Stand lesen, nicht die Arbeitskopie
  let content;
  try {
    content = mode === '--staged' ? git('show', `:${file}`) : git('show', `HEAD:${file}`);
  } catch {
    continue;
  }
  if (content.length > MAX_BYTES || content.includes(0)) continue;
  const lines = content.toString('utf8').split('\n');
  lines.forEach((line, index) => {
    if (line.includes('secret-scan: ignore')) return;
    for (const [name, pattern] of PATTERNS) {
      if (pattern.test(line)) findings.push(`${file}:${index + 1}: ${name}`);
    }
  });
}

if (findings.length > 0) {
  console.error('Mögliche Geheimnisse gefunden – nicht committen:');
  for (const finding of findings) console.error(`  ${finding}`);
  console.error(
    'Geheimnisse gehören in .env.local bzw. die Umgebungsvariablen des Hosters (SECURITY.md, Abschnitt 2).',
  );
  console.error('Falscher Treffer? Zeile mit „secret-scan: ignore“ kommentieren.');
  process.exit(1);
}
console.log(`Secret-Scan: ${files.length} Dateien geprüft, nichts gefunden.`);
