import type { EnduranceSport, TrackLap } from '../../db/types';
import { emptyActivity, ImportFileError, type ParsedActivity, type TrackPoint } from './types';

// GPX und TCX über den DOMParser des Browsers; Namensräume werden ignoriert (nur `localName`)

/** Sportart aus Text (GPX `type`, TCX `Sport`, Strava-Typen) */
export function sportFromText(text: string | null | undefined): EnduranceSport {
  const value = (text ?? '').trim().toLowerCase();
  // Strava-GPX nummeriert manche Typen: 1 = Rad, 9 = Laufen, 4 = Wandern, 10 = Gehen
  const numbered: Record<string, EnduranceSport> = {
    '1': 'ride',
    '9': 'run',
    '4': 'hike',
    '10': 'hike',
  };
  if (numbered[value]) return numbered[value];
  if (/yoga|pilates|stretch|mobility|flexib/.test(value)) return 'mobility';
  if (/swim/.test(value)) return 'swim';
  if (/run|jog|lauf/.test(value)) return 'run';
  if (/bik|cycl|ride|rad/.test(value)) return 'ride';
  if (/hik|walk|wander|trek|mountaineer/.test(value)) return 'hike';
  return 'other';
}

export function isXml(text: string): 'gpx' | 'tcx' | null {
  const head = text.slice(0, 2000);
  if (/<gpx[\s>]/.test(head)) return 'gpx';
  if (/<TrainingCenterDatabase[\s>]/.test(head)) return 'tcx';
  return null;
}

function parseXml(text: string): Document {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new ImportFileError('Die Datei ist beschädigt (kein gültiges XML)');
  }
  return doc;
}

function children(parent: Element, name: string): Element[] {
  return Array.from(parent.children).filter((child) => child.localName === name);
}

function child(parent: Element | undefined, ...path: string[]): Element | undefined {
  let current = parent;
  for (const name of path) {
    current = current && children(current, name)[0];
  }
  return current;
}

function descendants(parent: Element | Document, name: string): Element[] {
  return Array.from(parent.getElementsByTagNameNS('*', name));
}

function textOf(element: Element | undefined): string | null {
  const text = element?.textContent?.trim();
  return text ? text : null;
}

function numberOf(element: Element | undefined): number | null {
  const text = textOf(element);
  if (text === null) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function parseTime(text: string | null | undefined): number | null {
  const value = text ? Date.parse(text) : NaN;
  return Number.isNaN(value) ? null : value;
}

const timeOf = (element: Element | undefined) => parseTime(textOf(element));

function sortedPoints(points: (TrackPoint | null)[]): TrackPoint[] {
  return points.filter((point) => point !== null).sort((a, b) => a.time - b.time);
}

export function parseGpx(text: string): ParsedActivity[] {
  const root = parseXml(text).documentElement;
  if (root.localName !== 'gpx') throw new ImportFileError('Keine GPX-Datei');
  const creator = root.getAttribute('creator')?.trim() || null;
  const metadataName = textOf(child(root, 'metadata', 'name'));

  const tracks = children(root, 'trk');
  const activities = tracks.flatMap((track) => {
    const points = sortedPoints(
      descendants(track, 'trkpt').map((point) => {
        const time = timeOf(child(point, 'time'));
        if (time === null) return null;
        const lat = Number(point.getAttribute('lat'));
        const lon = Number(point.getAttribute('lon'));
        const valid = Number.isFinite(lat) && Number.isFinite(lon);
        return {
          time,
          lat: valid ? lat : null,
          lon: valid ? lon : null,
          altitude: numberOf(child(point, 'ele')),
          heartRate: numberOf(descendants(point, 'hr')[0]),
          distance: null,
        };
      }),
    );
    const first = points[0];
    if (!first) return [];
    return [
      emptyActivity('gpx', {
        device: creator,
        sport: sportFromText(textOf(child(track, 'type'))),
        title: textOf(child(track, 'name')) ?? metadataName ?? '',
        startTime: first.time,
        points,
      }),
    ];
  });
  if (activities.length === 0) {
    throw new ImportFileError('Keine Aufzeichnung mit Zeitangaben gefunden (nur eine Route?)');
  }
  return activities;
}

export function parseTcx(text: string): ParsedActivity[] {
  const doc = parseXml(text);
  if (doc.documentElement.localName !== 'TrainingCenterDatabase') {
    throw new ImportFileError('Keine TCX-Datei');
  }
  const activities = descendants(doc, 'Activity').map((activity) => {
    const lapElements = children(activity, 'Lap');
    const startTime =
      timeOf(child(activity, 'Id')) ?? parseTime(lapElements[0]?.getAttribute('StartTime'));
    const points = sortedPoints(
      descendants(activity, 'Trackpoint').map((point) => {
        const time = timeOf(child(point, 'Time'));
        if (time === null) return null;
        return {
          time,
          lat: numberOf(child(point, 'Position', 'LatitudeDegrees')),
          lon: numberOf(child(point, 'Position', 'LongitudeDegrees')),
          altitude: numberOf(child(point, 'AltitudeMeters')),
          heartRate: numberOf(child(point, 'HeartRateBpm', 'Value')),
          distance: numberOf(child(point, 'DistanceMeters')),
        };
      }),
    );
    const start = startTime ?? points[0]?.time;
    if (start === undefined) return null;

    const laps = lapElements.map((lap) => ({
      start: parseTime(lap.getAttribute('StartTime')),
      durationSeconds: numberOf(child(lap, 'TotalTimeSeconds')),
      distanceMeters: numberOf(child(lap, 'DistanceMeters')),
      calories: numberOf(child(lap, 'Calories')),
      avgHeartRate: numberOf(child(lap, 'AverageHeartRateBpm', 'Value')),
      maxHeartRate: numberOf(child(lap, 'MaximumHeartRateBpm', 'Value')),
    }));
    const sum = (values: (number | null)[]) =>
      values.some((value) => value !== null)
        ? values.reduce<number>((total, value) => total + (value ?? 0), 0)
        : null;
    const maxHeartRates = laps.map((lap) => lap.maxHeartRate).filter((value) => value !== null);
    const timerSeconds = sum(laps.map((lap) => lap.durationSeconds));
    // Durchschnittspuls über die Runden gewichtet nach Dauer
    const weighted = laps.filter((lap) => lap.avgHeartRate !== null && lap.durationSeconds);
    const weightedSeconds = weighted.reduce((total, lap) => total + lap.durationSeconds!, 0);

    return emptyActivity('tcx', {
      device: textOf(child(activity, 'Creator', 'Name')),
      sport: sportFromText(activity.getAttribute('Sport')),
      title: textOf(child(activity, 'Notes')) ?? '',
      startTime: start,
      timerSeconds,
      distanceMeters: sum(laps.map((lap) => lap.distanceMeters)),
      calories: sum(laps.map((lap) => lap.calories)),
      avgHeartRate:
        weightedSeconds > 0
          ? weighted.reduce((total, lap) => total + lap.avgHeartRate! * lap.durationSeconds!, 0) /
            weightedSeconds
          : null,
      maxHeartRate: maxHeartRates.length > 0 ? Math.max(...maxHeartRates) : null,
      points,
      laps: laps
        .filter((lap) => lap.start !== null && lap.durationSeconds !== null)
        .map((lap): TrackLap => ({
          startSeconds: Math.max(0, Math.round((lap.start! - start) / 1000)),
          durationSeconds: lap.durationSeconds!,
          distanceMeters: lap.distanceMeters,
          avgHeartRate: lap.avgHeartRate,
          maxHeartRate: lap.maxHeartRate,
        })),
    });
  });
  const valid = activities.filter((activity) => activity !== null);
  if (valid.length === 0) throw new ImportFileError('Die Datei enthält keine Einheit');
  return valid;
}
