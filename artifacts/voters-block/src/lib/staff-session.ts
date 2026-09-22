import { useMemo, useSyncExternalStore } from "react";

export type StaffRole = "ADMIN" | "STAFF";

export interface StaffCredentials {
  username: string;
  password: string;
}

export interface StaffSession {
  role: StaffRole;
  credentials: StaffCredentials;
}

const KEY = "voters-block-staff-session";
const EVENT = "voters-block-session-change";

function readSnapshot() {
  return window.sessionStorage.getItem(KEY);
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function parseSession(raw: string | null): StaffSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StaffSession>;
    if (
      (value.role === "ADMIN" || value.role === "STAFF") &&
      typeof value.credentials?.username === "string" &&
      typeof value.credentials?.password === "string"
    ) {
      return value as StaffSession;
    }
  } catch {
    // Invalid or stale session data is treated as signed out.
  }
  return null;
}

export function useStaffSession() {
  const raw = useSyncExternalStore(subscribe, readSnapshot, () => null);
  const session = useMemo(() => parseSession(raw), [raw]);

  return {
    session,
    role: session?.role ?? null,
    credentials: session?.credentials ?? null,
    displayName: session?.role === "ADMIN" ? "Administrator" : session?.role === "STAFF" ? "Staff Operator" : null,
    login(nextSession: StaffSession) {
      window.sessionStorage.setItem(KEY, JSON.stringify(nextSession));
      window.dispatchEvent(new Event(EVENT));
    },
    logout() {
      window.sessionStorage.removeItem(KEY);
      window.dispatchEvent(new Event(EVENT));
    },
  };
}