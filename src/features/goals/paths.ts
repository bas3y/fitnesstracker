export const GOALS_PATH = '/stats/goals';
export const NEW_GOAL_PATH = `${GOALS_PATH}/new`;

export function goalEditPath(id: string): string {
  return `${GOALS_PATH}/${id}/edit`;
}
