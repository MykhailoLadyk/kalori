
const BASE = "https://api.nal.usda.gov/fdc/v1";
const KEY  = import.meta.env.VITE_USDA_API_KEY;

const NUTRIENT_IDS = {
  calories: 1008,
  protein:  1003,
  carbs:    1005,
  fat:      1004,
  fiber:    1079,
};

function parseNutrients(foodNutrients = []) {
  const map = {};
  for (const n of foodNutrients) {
    const id = n.nutrientId ?? n.nutrient?.id;
    map[id] = n.value ?? n.amount ?? 0;
  }
  return {
    calories: Math.round(map[1008] ?? 0),
    protein:  Math.round((map[1003] ?? 0) * 10) / 10,
    carbs:    Math.round((map[1005] ?? 0) * 10) / 10,
    fat:      Math.round((map[1004] ?? 0) * 10) / 10,
    fiber:    Math.round((map[1079] ?? 0) * 10) / 10,
  };
}

function normalizeFood(f) {
  return {
    fdcId:       f.fdcId,
    name:        f.description,
    brand:       f.brandOwner ?? f.brandName ?? null,
    dataType:    f.dataType,
    servingSize: f.servingSize ?? 100,
    servingUnit: f.servingSizeUnit ?? "g",
    nutrients:   parseNutrients(f.foodNutrients),
  };
}

export async function searchFoods(query, { pageSize = 20 } = {}) {
  if (!query?.trim()) return [];

  const search = async (dataType, size) => {
    const params = new URLSearchParams({
      query,
      dataType,
      pageSize: String(size),
      api_key: KEY,
    });
    const res = await fetch(`${BASE}/foods/search?${params}`);
    if (!res.ok) throw new Error(`USDA search failed: ${res.status}`);
    const { foods = [] } = await res.json();
    return foods.map(normalizeFood);
  };

  const [generic, branded] = await Promise.all([
    search("Foundation,SR Legacy", 5),
    search("Branded", pageSize),
  ]);

  const priority = { Foundation: 0, "SR Legacy": 1, Branded: 2 };

  const seen = new Set();
  return [...generic, ...branded]
    .filter(f => {
      if (seen.has(f.fdcId)) return false;
      seen.add(f.fdcId);
      return true;
    })
    .sort((a, b) => (priority[a.dataType] ?? 9) - (priority[b.dataType] ?? 9));
}

export async function getFoodById(fdcId) {
  const res = await fetch(`${BASE}/food/${fdcId}?api_key=${KEY}`);
  if (!res.ok) throw new Error(`USDA fetch failed: ${res.status}`);

  const data = await res.json();
  return normalizeFood(data);
}

export function scaleNutrients(nutrients, baseServingG, userServingG) {
  const ratio = userServingG / baseServingG;
  return {
    calories: Math.round(nutrients.calories * ratio),
    protein:  Math.round(nutrients.protein  * ratio * 10) / 10,
    carbs:    Math.round(nutrients.carbs    * ratio * 10) / 10,
    fat:      Math.round(nutrients.fat      * ratio * 10) / 10,
    fiber:    Math.round(nutrients.fiber    * ratio * 10) / 10,
  };
}
