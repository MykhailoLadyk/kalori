import { createContext, useState, useEffect } from "react";
import { fetchGameData, updateGameData } from "../services/gameService";

export const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true);
        const data = await fetchGameData();
        setGameData(data);
      } catch (error) {
        setError("Failed to fetch game data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadGameData();
  }, []);

  const handleUpdateGameData = async (updates) => {
    try {
      setUpdating(true);
      const updatedGameData = await updateGameData(updates);
      setGameData(updatedGameData);
    } catch (error) {
      setError(error.message || "Failed to update game data");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAwardXP = async (amount) => {
    try {
      setUpdating(true);
      const newXp = gameData.xp_total + amount;
      const newLevel = 7; // Placeholder - replace with actual level calculation logic based on XP thresholds
      const result = await updateGameData({ xp_total: newXp, level: newLevel });
      setGameData(result);
    } catch (error) {
      setError(error.message || "Failed to award XP");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };
  return (
    <GameContext.Provider
      value={{
        gameData,
        error,
        loading,
        updating,
        updateGameData: handleUpdateGameData,
        awardXp: handleAwardXP,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
