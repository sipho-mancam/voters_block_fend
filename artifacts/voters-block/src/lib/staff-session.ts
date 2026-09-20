import { useSyncExternalStore } from "react";

export type StaffRole = "ADMIN" | "VIEWER";

const KEY = "voters-block-staff-role";
const EVENT = "voters-block-session-change";

function readRole(): StaffRole | null {
  const value = window.localStorage.getItem(KEY);
  return value === "ADMIN" || value === "VIEWER" ? value : null;
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useStaffSession() {
  const role = useSyncExternalStore(subscribe, readRole, () => null);
  return {
    role,
    displayName: role === "ADMIN" ? "Administrator" : role === "VIEWER" ? "Live Viewer" : null,
    login(nextRole: StaffRole) {
      window.localStorage.setItem(KEY, nextRole);
      window.dispatchEvent(new Event(EVENT));
    },
    logout() {
      window.localStorage.removeItem(KEY);
      window.dispatchEvent(new Event(EVENT));
    },
  };
}