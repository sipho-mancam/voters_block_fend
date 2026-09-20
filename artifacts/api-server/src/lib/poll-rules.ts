export type Role = "ADMIN" | "OPERATOR";
export type RosterRow = { name: string; squadNumber: string };

export const POLL_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function closesAt(openedAt: Date) {
  return new Date(openedAt.getTime() + POLL_LIFETIME_MS);
}

export function isExpired(status: string, pollClosesAt: Date | null, now = new Date()) {
  return status === "OPEN" && pollClosesAt !== null && pollClosesAt <= now;
}

export function canManagePolls(role: Role) {
  return role === "ADMIN";
}

export function validateRoster(players: RosterRow[]) {
  if (players.length < 2 || players.length > 100) return "Roster must contain 2 to 100 players";
  const names = new Set<string>();
  const numbers = new Set<string>();
  for (const player of players) {
    const name = player.name.trim().toLowerCase();
    const number = player.squadNumber.trim().toLowerCase();
    if (name.length < 2 || !number) return "Every player needs a valid name and squad number";
    if (names.has(name) || numbers.has(number)) return "Player names and squad numbers must be unique";
    names.add(name);
    numbers.add(number);
  }
  return null;
}

export function canOpenPoll(playerCount: number, anotherPollIsOpen: boolean) {
  if (playerCount === 0) return "Upload a valid player roster before opening the poll";
  if (anotherPollIsOpen) return "Another poll is already open";
  return null;
}
