// src/auth/AuthContext.jsx
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { login as apiLogin, signup as apiSignup, logout as apiLogout, getAuthToken } from "../api/auth";
import { getMyProfile } from "../api/profile";
import { showToast } from "../utils/toast";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // full user object
  const [loading, setLoading] = useState(true);

  // Bootstrap: if token exists, fetch current user
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          if (active) setUser(null);
        } else {
          const me = await getMyProfile();
          if (active) setUser(me);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await getMyProfile();
    setUser(me);
    return me;
  }, []);

  const signup = useCallback(async (email, password, role) => {
    const { token } = await apiSignup({ email, password, role });
    if (!token) throw new Error("Signup did not return a token.");
    const me = await getMyProfile();
    setUser(me);
    return me;
  }, []);

  const login = useCallback(async (email, password) => {
    const { token } = await apiLogin({ email, password });
    if (!token) throw new Error("Login did not return a token.");
    const me = await getMyProfile();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    apiLogout();       // clears token
    setUser(null);
    showToast({ variant: "success", message: "Logged out" });
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser }),
    [user, loading, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}