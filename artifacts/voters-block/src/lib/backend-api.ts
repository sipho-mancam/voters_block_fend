export type ApiRole = "ADMIN" | "VOTER" | "VIEWER";

export interface Candidate {
  id: number;
  name: string;
  metadata: string | null;
  votes: number;
}

export interface Poll {
  id: number;
  active: boolean;
  createdAt: string;
  candidates: Candidate[];
}

export interface PollResults {
  pollId: number;
  active: boolean;
  totalVotes: number;
  candidates: Candidate[];
}

export interface VoteReceipt {
  pollId: number;
  candidateId: number;
  message: string;
}

const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE = (configuredBase || "/api").replace(/\/+$/, "");

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

async function request<T>(
  path: string,
  role: ApiRole,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "X-User-Role": role,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new BackendError(payload?.error || `Request failed (${response.status})`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const votersBlockApi = {
  listPolls: (role: ApiRole = "VIEWER") =>
    request<Poll[]>("/polls", role),

  createPoll: (active = true) =>
    request<Poll>("/admin/polls", "ADMIN", {
      method: "POST",
      body: JSON.stringify({ active }),
    }),

  addCandidates: (
    pollId: number,
    candidates: Array<{ name: string; metadata?: string }>,
  ) =>
    request<Candidate[]>(`/admin/polls/${pollId}/candidates/bulk`, "ADMIN", {
      method: "POST",
      body: JSON.stringify(candidates),
    }),

  updateCandidate: (
    pollId: number,
    candidateId: number,
    candidate: { name: string; metadata?: string },
  ) =>
    request<Candidate>(`/admin/polls/${pollId}/candidates/${candidateId}`, "ADMIN", {
      method: "PUT",
      body: JSON.stringify(candidate),
    }),

  removeCandidate: (pollId: number, candidateId: number) =>
    request<void>(`/admin/polls/${pollId}/candidates/${candidateId}`, "ADMIN", {
      method: "DELETE",
    }),

  vote: (pollId: number, candidateId: number, deviceId: string) =>
    request<VoteReceipt>(`/polls/${pollId}/votes`, "VOTER", {
      method: "POST",
      body: JSON.stringify({ candidateId, deviceId }),
    }),

  results: (pollId: number, role: ApiRole = "VIEWER") =>
    request<PollResults>(`/polls/${pollId}/results`, role),

  setActive: (pollId: number, active: boolean) =>
    request<Poll>(`/admin/polls/${pollId}/active?active=${active}`, "ADMIN", {
      method: "PATCH",
    }),
};

export function publicVotingUrl() {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}
