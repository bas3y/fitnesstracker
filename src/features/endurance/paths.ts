import type { EnduranceSport } from '../../db/types';

export const SESSIONS_PATH = '/training/sessions';
export const GEAR_PATH = '/training/gear';
export const IMPORT_PATH = '/training/import';

export function activityPath(sport: EnduranceSport): string {
  return `/training/activity/${sport}`;
}

export function newSessionPath(sport: EnduranceSport): string {
  return `${activityPath(sport)}/new`;
}

export function sessionPath(id: string): string {
  return `${SESSIONS_PATH}/${id}`;
}

export function gearPath(id: string): string {
  return `${GEAR_PATH}/${id}`;
}
