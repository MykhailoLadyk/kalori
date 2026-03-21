import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchMeals,
  addMeal,
  updateMeal,
  deleteMeal,
  fetchMealsByRange,
} from "./mealService";

vi.mock("./supabase.js", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from "./supabase.js";
function mockChain(finalResponse, methods = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResponse),
    then: (resolve) => resolve(finalResponse),
    ...methods,
  };
  supabase.from.mockReturnValue(chain);
  return chain;
}
const MOCK_USER = { id: "user-123" };

const MOCK_MEAL = {
  id: "meal-1",
  user_id: "user-123",
  name: "Chicken & Rice",
  calories: 520,
  protein: 42,
  carbs: 55,
  fat: 8,
  type: "lunch",
  date: "2025-02-27",
  created_at: "2025-02-27T12:00:00Z",
};

const MOCK_MEALS = [
  MOCK_MEAL,
  {
    ...MOCK_MEAL,
    id: "meal-2",
    name: "Greek Yogurt",
    calories: 120,
    type: "lunch",
  },
  {
    ...MOCK_MEAL,
    id: "meal-3",
    name: "Oat Porridge",
    calories: 320,
    type: "breakfast",
  },
];

const AUTH_OK = {
  data: { user: MOCK_USER },
  error: null,
};

const AUTH_FAIL = {
  data: { user: null },
  error: { message: "Auth session expired" },
};

const NO_USER = {
  data: { user: null },
  error: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});
// ─────────────────────────────────────────
// fetchMeals
// ─────────────────────────────────────────
describe("fetchMeals", () => {
  it("returns meals for a given date", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ data: MOCK_MEALS, error: null });

    const result = await fetchMeals("2025-02-27");

    expect(result).toEqual(MOCK_MEALS);
  });

  it("queries with correct user_id and date", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    const chain = mockChain({ data: MOCK_MEALS, error: null });

    await fetchMeals("2025-02-27");

    expect(supabase.from).toHaveBeenCalledWith("meals");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(chain.eq).toHaveBeenCalledWith("date", "2025-02-27");
  });

  it("returns empty array when no meals for that date", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ data: [], error: null });

    const result = await fetchMeals("2025-02-27");

    expect(result).toEqual([]);
  });

  it("throws if not authenticated", async () => {
    supabase.auth.getUser.mockResolvedValue(NO_USER);

    await expect(fetchMeals("2025-02-27")).rejects.toThrow(
      "No authenticated user",
    );
  });

  it("throws if auth fails", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_FAIL);

    await expect(fetchMeals("2025-02-27")).rejects.toThrow(
      "Auth session expired",
    );
  });

  it("throws if query fails", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ data: null, error: { message: "Query failed" } });

    await expect(fetchMeals("2025-02-27")).rejects.toThrow("Query failed");
  });
});

// ─────────────────────────────────────────
// addMeal
// ─────────────────────────────────────────
describe("addMeal", () => {
  const NEW_MEAL = {
    name: "Protein Bar",
    calories: 210,
    protein: 20,
    carbs: 22,
    fat: 7,
    type: "snacks",
    date: "2025-02-27",
  };

  it("returns the created meal with id", async () => {
    const created = { ...NEW_MEAL, id: "meal-4", user_id: "user-123" };
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ data: created, error: null });

    const result = await addMeal(NEW_MEAL);

    expect(result).toEqual(created);
    expect(result.id).toBeDefined();
  });

  it("inserts with correct fields including user_id", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    const chain = mockChain({
      data: { ...NEW_MEAL, id: "meal-4" },
      error: null,
    });

    await addMeal(NEW_MEAL);

    expect(chain.insert).toHaveBeenCalledWith({
      user_id: "user-123",
      name: "Protein Bar",
      calories: 210,
      protein: 20,
      carbs: 22,
      fat: 7,
      type: "snacks",
      date: "2025-02-27",
    });
  });

  it("throws if not authenticated", async () => {
    supabase.auth.getUser.mockResolvedValue(NO_USER);

    await expect(addMeal(NEW_MEAL)).rejects.toThrow("No authenticated user");
  });

  it("throws if insert fails", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ data: null, error: { message: "Insert failed" } });

    await expect(addMeal(NEW_MEAL)).rejects.toThrow("Insert failed");
  });
});

// ─────────────────────────────────────────
// updateMeal
// ─────────────────────────────────────────
describe("updateMeal", () => {
  it("returns the updated meal", async () => {
    const updates = { calories: 480, protein: 38 };
    const updated = { ...MOCK_MEAL, ...updates };

    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ data: updated, error: null });

    const result = await updateMeal("meal-1", updates);

    expect(result).toEqual(updated);
  });

  it("filters by both id and user_id for security", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    const chain = mockChain({ data: MOCK_MEAL, error: null });

    await updateMeal("meal-1", { calories: 480 });

    expect(chain.eq).toHaveBeenCalledWith("id", "meal-1");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("throws if not authenticated", async () => {
    supabase.auth.getUser.mockResolvedValue(NO_USER);

    await expect(updateMeal("meal-1", {})).rejects.toThrow(
      "No authenticated user",
    );
  });

  it("throws if update fails", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ data: null, error: { message: "Update failed" } });

    await expect(updateMeal("meal-1", {})).rejects.toThrow("Update failed");
  });
});

// ─────────────────────────────────────────
// deleteMeal
// ─────────────────────────────────────────
describe("deleteMeal", () => {
  it("returns true on successful delete", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ error: null });

    const result = await deleteMeal("meal-1");

    expect(result).toBe(true);
  });

  it("filters by both id and user_id for security", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    const chain = mockChain({ error: null });

    await deleteMeal("meal-1");

    expect(chain.eq).toHaveBeenCalledWith("id", "meal-1");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("throws if not authenticated", async () => {
    supabase.auth.getUser.mockResolvedValue(NO_USER);

    await expect(deleteMeal("meal-1")).rejects.toThrow("No authenticated user");
  });

  it("throws if delete fails", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ error: { message: "Delete failed" } });

    await expect(deleteMeal("meal-1")).rejects.toThrow("Delete failed");
  });
});

// ─────────────────────────────────────────
// fetchMealsByRange
// ─────────────────────────────────────────
describe("fetchMealsByRange", () => {
  it("returns meals within date range", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ data: MOCK_MEALS, error: null });

    const result = await fetchMealsByRange("2025-02-21", "2025-02-27");

    expect(result).toEqual(MOCK_MEALS);
  });

  it("queries with correct date range filters", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    const chain = mockChain({ data: MOCK_MEALS, error: null });

    await fetchMealsByRange("2025-02-21", "2025-02-27");

    expect(chain.gte).toHaveBeenCalledWith("date", "2025-02-21");
    expect(chain.lte).toHaveBeenCalledWith("date", "2025-02-27");
  });

  it("returns empty array when no meals in range", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ data: [], error: null });

    const result = await fetchMealsByRange("2025-01-01", "2025-01-07");

    expect(result).toEqual([]);
  });

  it("throws if not authenticated", async () => {
    supabase.auth.getUser.mockResolvedValue(NO_USER);

    await expect(fetchMealsByRange("2025-02-21", "2025-02-27")).rejects.toThrow(
      "No authenticated user",
    );
  });

  it("throws if query fails", async () => {
    supabase.auth.getUser.mockResolvedValue(AUTH_OK);
    mockChain({ data: null, error: { message: "Range query failed" } });

    await expect(fetchMealsByRange("2025-02-21", "2025-02-27")).rejects.toThrow(
      "Range query failed",
    );
  });
});
