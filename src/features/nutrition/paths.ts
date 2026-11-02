export const NUTRITION_PATH = '/daily/nutrition';
export const FOODS_PATH = '/daily/foods';
export const NEW_FOOD_PATH = `${FOODS_PATH}/new`;
export const NEW_RECIPE_PATH = `${FOODS_PATH}/new-recipe`;

export function foodPath(id: string): string {
  return `${FOODS_PATH}/${id}`;
}
