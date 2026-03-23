import { createContext, useContext, useState, useEffect } from "react";
import { fetchUser, updateUser } from "../services/userService";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await fetchUser();
        setUser(userData);
      } catch (error) {
        setError(error.message || "Failed to fetch user");
        console.error("Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleUpdateUser = async (updates) => {
    try {
      setUpdating(true);
      const updatedUser = await updateUser(updates);
      setUser(updatedUser);
    } catch (error) {
      setError(error.message || "Failed to update user");
      console.error("Failed to fetch user");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        updating,
        error,
        updateUser: handleUpdateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
