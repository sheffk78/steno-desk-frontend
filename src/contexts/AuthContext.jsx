import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, errMessage } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = anon, object = signed in
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch (e) {
      setUser(false);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data.user);
      return data.user;
    } catch (e) {
      const msg = errMessage(e, "Incorrect email or password.");
      setError(msg);
      throw new Error(msg);
    }
  };

  const signup = async (email, password, name, beta = false) => {
    setError("");
    try {
      const { data } = await api.post("/auth/signup", { email, password, name, beta });
      setUser(data.user);
      return data.user;
    } catch (e) {
      const msg = errMessage(e, "Could not create account.");
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {}
    setUser(false);
  };

  const updateSettings = async (payload) => {
    const { data } = await api.put("/auth/settings", payload);
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, error, setError, login, signup, logout, refresh, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
