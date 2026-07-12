import { createContext, useContext, useState } from "react";
import {
  MOCK_CLAIMS,
  MOCK_VERDICTS,
  MOCK_NOTIFICATIONS,
} from "../data/mockData.js";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [claims, setClaims] = useState(MOCK_CLAIMS);
  const [verdicts, setVerdicts] = useState(MOCK_VERDICTS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const getClaim = (id) => claims.find((c) => c.id === id);
  const getVerdicts = (id) => verdicts[id] || [];

  const addNotification = (n) =>
    setNotifications((prev) => [
      {
        id: `n${Date.now()}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        ...n,
      },
      ...prev,
    ]);

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );

  const addClaim = (claim) => {
    setClaims((prev) => [claim, ...prev]);
    return claim;
  };

  const addVerdict = (claimId, verdictObj) => {
    setVerdicts((prev) => ({
      ...prev,
      [claimId]: [...(prev[claimId] || []), verdictObj],
    }));
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? { ...c, verificationCount: (c.verificationCount || 0) + 1 }
          : c,
      ),
    );
    return verdictObj;
  };

  const updateClaim = (claimId, patch) =>
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, ...patch } : c)),
    );

  const removeClaim = (claimId) =>
    setClaims((prev) => prev.filter((c) => c.id !== claimId));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DataContext.Provider
      value={{
        claims,
        verdicts,
        notifications,
        unreadCount,
        getClaim,
        getVerdicts,
        addClaim,
        addVerdict,
        updateClaim,
        removeClaim,
        addNotification,
        markAllRead,
        markRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
