import type { StaffCredentials } from "@/lib/staff-session";

export interface Candidate {
  id: number;
  name: string;
  metadata: string | null;
  votes: number;
}

export interface PollDetails {
  name: string;
  image1: string | null;
  image2: string | null;
  location: string;
}

export interface Poll {
  id: number;
  active: boolean;
  createdAt: string;
  candidates: Candidate[];
  details?: PollDetails;
  name?: string;
  image1?: string | null;
  image2?: string | null;
  location?: string;
}

export interface PollResults {
  pollId: number;
  active: boolean;
  totalVotes: number;
  candidates: Candidate[];
  details?: PollDetails;
  name?: string;
  image1?: string | null;
  image2?: string | null;
  location?: string;
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
  credentials?: StaffCredentials | null,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(credentials ? { Authorization: basicAuthHeader(credentials) } : {}),
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

function basicAuthHeader(credentials: StaffCredentials) {
  const bytes = new TextEncoder().encode(`${credentials.username}:${credentials.password}`);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `Basic ${window.btoa(binary)}`;
}

export const votersBlockApi = {
  authenticate: (credentials: StaffCredentials) =>
    request<Poll[]>("/polls", credentials),

  listPolls: (credentials?: StaffCredentials | null) =>
    request<Poll[]>("/polls", credentials),

  createPoll: (
    credentials: StaffCredentials,
    poll: { active: boolean; name: string; image1?: string; image2?: string; location: string },
  ) =>
    request<Poll>("/admin/polls", credentials, {
      method: "POST",
      body: JSON.stringify(poll),
    }),

  addCandidate: (
    credentials: StaffCredentials,
    pollId: number,
    candidate: { name: string; metadata?: string },
  ) =>
    request<Candidate>(`/admin/polls/${pollId}/candidates`, credentials, {
      method: "POST",
      body: JSON.stringify(candidate),
    }),

  addCandidates: (
    credentials: StaffCredentials,
    pollId: number,
    candidates: Array<{ name: string; metadata?: string }>,
  ) =>
    request<Candidate[]>(`/admin/polls/${pollId}/candidates/bulk`, credentials, {
      method: "POST",
      body: JSON.stringify(candidates),
    }),

  updateCandidate: (
    credentials: StaffCredentials,
    pollId: number,
    candidateId: number,
    candidate: { name: string; metadata?: string },
  ) =>
    request<Candidate>(`/admin/polls/${pollId}/candidates/${candidateId}`, credentials, {
      method: "PUT",
      body: JSON.stringify(candidate),
    }),

  removeCandidate: (credentials: StaffCredentials, pollId: number, candidateId: number) =>
    request<void>(`/admin/polls/${pollId}/candidates/${candidateId}`, credentials, {
      method: "DELETE",
    }),

  vote: (pollId: number, candidateId: number, deviceId: string) =>
    request<VoteReceipt>(`/polls/${pollId}/votes`, null, {
      method: "POST",
      body: JSON.stringify({ candidateId, deviceId }),
    }),

  results: (pollId: number, credentials: StaffCredentials) =>
    request<PollResults>(`/polls/${pollId}/results`, credentials),

  setActive: (credentials: StaffCredentials, pollId: number, active: boolean) =>
    request<Poll>(`/admin/polls/${pollId}/active?active=${active}`, credentials, {
      method: "PATCH",
    }),
};

export function publicVotingUrl() {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

export function getPollDetails(poll: Poll | PollResults): PollDetails {
  return poll.details ?? {
    name: poll.name || `Poll #${"id" in poll ? poll.id : poll.pollId}`,
    image1: poll.image1 ?? null,
    image2: poll.image2 ?? null,
    location: poll.location || "",
  };
}
