import { useNavigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { createRecipe, createUserFood, updateRecipe, updateUserFood } from '../../db/foods';
import { EMPTY_FOOD_INPUT, EMPTY_RECIPE_INPUT } from '../../db/schemas';
import { FoodForm } from './FoodForm';
import { foodPath, FOODS_PATH } from './paths';
import { RecipeForm } from './RecipeForm';
import { useFood } from './useNutrition';

export function FoodCreatePage() {
  const navigate = useNavigate();
  return (
    <Page title="Eigenes Lebensmittel" backTo={FOODS_PATH}>
      <FoodForm
        initial={EMPTY_FOOD_INPUT}
        submitLabel="Anlegen"
        onSubmit={async (input) => {
          const food = await createUserFood(input);
          navigate(foodPath(food.id), { replace: true });
        }}
        onCancel={() => navigate(FOODS_PATH)}
      />
    </Page>
  );
}

export function RecipeCreatePage() {
  const navigate = useNavigate();
  return (
    <Page title="Neues Rezept" backTo={FOODS_PATH}>
      <RecipeForm
        initial={EMPTY_RECIPE_INPUT}
        submitLabel="Anlegen"
        onSubmit={async (input) => {
          const food = await createRecipe(input);
          navigate(foodPath(food.id), { replace: true });
        }}
        onCancel={() => navigate(FOODS_PATH)}
      />
    </Page>
  );
}

export function FoodEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const food = useFood(id);

  if (food === undefined) return <Page title="Bearbeiten">{null}</Page>;
  if (food === null || food.source !== 'user') {
    return (
      <Page title="Bearbeiten" backTo={FOODS_PATH}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">
            Dieses Lebensmittel lässt sich nicht bearbeiten.
          </p>
        </Card>
      </Page>
    );
  }

  const detailPath = foodPath(food.id);
  const done = () => navigate(detailPath, { replace: true });
  if (food.recipe) {
    const { ingredients, cookedWeightGrams, servings } = food.recipe;
    return (
      <Page title="Rezept bearbeiten" backTo={detailPath}>
        <RecipeForm
          initial={{ name: food.name, ingredients, cookedWeightGrams, servings }}
          submitLabel="Speichern"
          onSubmit={async (input) => {
            await updateRecipe(food.id, input);
            done();
          }}
          onCancel={() => navigate(detailPath)}
        />
      </Page>
    );
  }

  const {
    name,
    aliases,
    category,
    kcal,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    alcohol,
    portions,
    barcode,
  } = food;
  return (
    <Page title="Lebensmittel bearbeiten" backTo={detailPath}>
      <FoodForm
        initial={{
          name,
          aliases,
          category,
          kcal,
          protein,
          carbs,
          fat,
          fiber,
          sugar,
          alcohol,
          portions,
          barcode,
        }}
        submitLabel="Speichern"
        onSubmit={async (input) => {
          await updateUserFood(food.id, input);
          done();
        }}
        onCancel={() => navigate(detailPath)}
      />
    </Page>
  );
}
