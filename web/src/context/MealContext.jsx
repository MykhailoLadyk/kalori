import { createContext, useEffect, useState } from "react";
import {
  fetchMeals,
  addMeal,
  deleteMeal,
  updateMeal,
  fetchMealsByRange,
} from "../services/mealService";

export const MealContext = createContext(null);

export function MealProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [meals, setMeals] = useState([]);
  const [rangeMeals, setRangeMeals] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);

  useEffect(() => {
    const loadMeals = async () => {
      try {
        setLoading(true);
        const meals = await fetchMeals();
        setMeals(meals);
      } catch (error) {
        console.error("Failed to fetch meals");
        setError(error.message || "Failed to fetch meals");
      } finally {
        setLoading(false);
      }
    };
    loadMeals();
  }, []);
  const handleAddMeal = async (meal) => {
    try {
      setUpdating(true);
      const newMeal = await addMeal(meal);
      setMeals((prev) => [...prev, newMeal]);
      if (rangeMeals.length > 0) {
        setRangeMeals((prev) => [...prev, newMeal]);
      }
    } catch (error) {
      console.error("Failed to add meal");
      setError(error.message || "Failed to add meal");
    } finally {
      setUpdating(false);
    }
  };
  const handleDeleteMeal = async (id) => {
    try {
      setUpdating(true);
      await deleteMeal(id);
      setMeals((prev) => prev.filter((meal) => meal.id !== id));
      if (rangeMeals.length > 0) {
        setRangeMeals((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete meal");
      setError(error.message || "Failed to delete meal");
    } finally {
      setUpdating(false);
    }
  };
  const handleUpdateMeal = async (id, updates) => {
    try {
      setUpdating(true);
      const newMeal = await updateMeal(id, updates);
      setMeals((prev) => prev.map((m) => (m.id === id ? newMeal : m)));
      if (rangeMeals.length > 0) {
        setRangeMeals((prev) => prev.map((m) => (m.id === id ? newMeal : m)));
      }
    } catch (error) {
      console.error("Failed to edit meal");
      setError(error.message || "Failed to edit meal");
    } finally {
      setUpdating(false);
    }
  };

  const handleFetchMealsByRange = async (startDate, endDate) => {
    try {
      setRangeLoading(true);
      const data = await fetchMealsByRange(startDate, endDate);
      setRangeMeals(data);
    } catch (err) {
      console.error("Failed to fetch meals by range");
      setError(err.message || "Failed to fetch meals by range");
    } finally {
      setRangeLoading(false);
    }
  };
  return (
    <MealContext.Provider
      value={{
        meals,
        error,
        loading,
        updating,
        rangeMeals,
        rangeLoading,
        addMeal: handleAddMeal,
        deleteMeal: handleDeleteMeal,
        updateMeal: handleUpdateMeal,
        fetchMealsByRange: handleFetchMealsByRange,
      }}
    >
      {children}
    </MealContext.Provider>
  );
}
