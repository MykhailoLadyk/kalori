import { supabase } from "./supabase";
export const fetchMeals = async (date) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("No authenticated user");
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("id", user.id)
    .eq("date", date)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};
export const updateMeal = async (date, updates) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("No authenticated user");
  const { data, error } = await supabase
    .from("meals")
    .update(updates)
    .eq("id", user.id)
    .eq("date", date)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};
export async function deleteMeal(id) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("No authenticated user");

  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return true;
}
export async function addMeal(meal) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("meals")
    .insert({
      user_id: user.id,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      type: meal.type, // "breakfast" | "lunch" | "dinner" | "snacks"
      date: meal.date,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
export async function fetchMealsByRange(startDate, endDate) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate) // greater than or equal
    .lte("date", endDate) // less than or equal
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
