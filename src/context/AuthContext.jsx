import { createContext, useContext, useState } from "react";
import { MOCK_CURRENT_USER } from "../data/mockData.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = (email, password) => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setLoading(false);
        if (!email || !password) {
          reject(new Error("Incorrect email or password. Try again."));
          return;
        }
        setUser(MOCK_CURRENT_USER);
        resolve(MOCK_CURRENT_USER);
      }, 500);
    });
  };

  const loginWithGoogle = () => {
    setUser(MOCK_CURRENT_USER);
    return Promise.resolve(MOCK_CURRENT_USER);
  };

  const register = (name, email, password) => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setLoading(false);
        setUser({ ...MOCK_CURRENT_USER, displayName: name, email });
        resolve();
      }, 500);
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        loginWithGoogle,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
