import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, ShieldCheck, Trophy, WifiOff } from "lucide-react";
import { Link } from "wouter";
import { BackendError, getPollDetails, votersBlockApi } from "@/lib/backend-api";
import { useDeviceId } from "@/hooks/use-device-id";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

const CURRENT_VOTE_KEY = "voters-block-current-vote";

function readCurrentVote(): number | null {
  try {
    const value = window.localStorage.getItem(CURRENT_VOTE_KEY);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

function saveCurrentVote(candidateId: number | null): void {
  try {
    if (candidateId === null) window.localStorage.removeItem(CURRENT_VOTE_KEY);
    else window.localStorage.setItem(CURRENT_VOTE_KEY, String(candidateId));
  } catch {
    // The current selection still works in memory when browser storage is blocked.
  }
}

export default function PublicVoting() {
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingCandidate, setPendingCandidate] = useState<number | null>(null);
  const [currentVote, setCurrentVote] = useState<number | null>(readCurrentVote);

  const pollsQuery = useQuery({
    queryKey: ["backend", "active-polls", "voter"],
    queryFn: () => votersBlockApi.listPolls(),
    refetchInterval: 15_000,
    retry: 1,
  });
  const poll = pollsQuery.data?.find((item) => item.active) ?? null;

  useEffect(() => {
    if (!poll || currentVote === null) return;
    const belongsToPoll = poll.candidates.some((candidate) => candidate.id === currentVote);
    if (!belongsToPoll) {
      setCurrentVote(null);
      saveCurrentVote(null);
    }
  }, [poll, currentVote]);

  const voteMutation = useMutation({
    mutationFn: ({ pollId, candidateId }: { pollId: number; candidateId: number }) => {
      if (!deviceId) throw new Error("Device identifier is not ready");
      return votersBlockApi.vote(pollId, candidateId, deviceId);
    },
    onSuccess: (receipt) => {
      setCurrentVote(receipt.candidateId);
      saveCurrentVote(receipt.candidateId);
      setPendingCandidate(null);
      queryClient.invalidateQueries({ queryKey: ["backend", "active-polls"] });
      toast({ title: "Vote recorded", description: receipt.message });
    },
    onError: (error: Error) => {
      setPendingCandidate(null);
      toast({ title: "Vote failed", description: error.message, variant: "destructive" });
    },
  });

  if (!deviceId || pollsQuery.isLoading) {
    return <LoadingState />;
  }

  if (pollsQuery.isError) {
    const unauthorized = pollsQuery.error instanceof BackendError && pollsQuery.error.status === 401;
    return (
      <MessageState
        icon={<WifiOff size={38} />}
        title={unauthorized ? "Voting access is not public" : "Voting service unavailable"}
        message={unauthorized ? "The voting API is requiring a login for the public poll list. Voters should not need to sign in; the API must allow anonymous GET requests to /api/polls." : "We could not reach the match voting server. Check your connection and try again."}
        action={() => pollsQuery.refetch()}
      />
    );
  }

  if (!poll) {
    return (
      <MessageState
        icon={<Trophy size={40} />}
        title="No active poll"
        message="There is currently no Man of the Match vote open. Please check back during the match."
      />
    );
  }
  const pollDetails = getPollDetails(poll);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-white/15 bg-secondary px-4 py-3 text-secondary-foreground shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo variant="white" className="h-11 w-40 sm:h-12 sm:w-48" />
            <div className="hidden border-l border-white/25 pl-4 font-display text-base font-bold uppercase leading-none tracking-wide sm:block">
              Man of the<br /><span className="text-primary">Match</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 border border-primary/60 bg-primary/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Live vote
            </div>
            <StaffAccessLink compact />
          </div>
        </div>
      </header>

      <main className="w-full flex-1">
        <div className="broadcast-panel relative overflow-hidden border-b-4 border-primary">
          <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-24 select-none font-display text-[22rem] font-black leading-none text-white/[0.035] sm:right-[10%]">S</div>
          <div className="relative mx-auto max-w-3xl px-4 pb-9 pt-10 md:px-6 md:pb-12 md:pt-14">
            <p className="mb-3 flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white/60"><span className="h-1.5 w-1.5 bg-primary" />{pollDetails.location || `Poll #${poll.id}`}</p>
            <h1 className="max-w-2xl text-5xl font-black uppercase leading-[0.92] tracking-tight text-white md:text-7xl">{pollDetails.name}</h1>
            <p className="mt-6 border-l-2 border-primary pl-3 text-sm text-white/65">Pick your standout player. Your latest selection replaces your previous vote.</p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-7 md:px-6 md:pt-10">
        <div className="mb-5 flex items-end justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">The lineup</p><h2 className="text-3xl font-black uppercase leading-none">Cast your vote</h2></div><span className="font-mono text-[11px] text-muted-foreground">{poll.candidates.length} candidates</span></div>
        {currentVote !== null && (
          <div className="mb-6 flex gap-3 border-l-4 border-primary bg-primary/10 p-4">
            <Check className="mt-0.5 text-primary" />
            <div><p className="font-bold uppercase">Vote registered</p><p className="font-mono text-xs text-muted-foreground">You can change it while voting remains open.</p></div>
          </div>
        )}

        <div className="space-y-3">
          {poll.candidates.map((candidate, index) => {
            const selected = currentVote === candidate.id;
            const pending = voteMutation.isPending && pendingCandidate === candidate.id;
            return (
              <Card
                key={candidate.id}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                onClick={() => {
                  if (!pending && !selected) {
                    setPendingCandidate(candidate.id);
                    voteMutation.mutate({ pollId: poll.id, candidateId: candidate.id });
                  }
                }}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && !selected) {
                    event.preventDefault();
                    setPendingCandidate(candidate.id);
                    voteMutation.mutate({ pollId: poll.id, candidateId: candidate.id });
                  }
                }}
                data-testid={`button-vote-candidate-${candidate.id}`}
                className={`cursor-pointer overflow-hidden rounded-sm border bg-card transition-[border-color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:-translate-y-0.5 hover:border-foreground/50 hover:shadow-md"}`}
              >
                <CardContent className="flex items-stretch p-0">
                  <div className={`flex w-14 items-center justify-center border-r font-display text-3xl font-black sm:w-20 ${selected ? "border-primary bg-primary text-primary-foreground" : "bg-secondary text-white/55"}`}>{String(index + 1).padStart(2, "0")}</div>
                  <div className="min-w-0 flex-1 p-4 sm:px-6">
                    <h3 className="truncate text-2xl font-bold uppercase leading-tight tracking-tight">{candidate.name}</h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{candidate.metadata || "Player"}</p>
                  </div>
                  <div className="flex w-16 items-center justify-center">
                    {pending ? <Loader2 className="animate-spin text-primary" /> : selected ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check size={17} /></span> : <span className="h-8 w-8 rounded-full border-2 border-muted-foreground/30" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function LoadingState() {
  return <div className="flex min-h-[100dvh] flex-col"><div className="flex items-center justify-between bg-secondary px-4 py-3"><BrandLogo variant="white" className="h-11 w-44" /><StaffAccessLink compact /></div><div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-20"><div className="mb-8 h-3 w-28 animate-pulse bg-muted" /><div className="mb-5 h-14 w-3/4 animate-pulse bg-muted" /><div className="mb-12 h-5 w-1/2 animate-pulse bg-muted" /><div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse border border-border bg-card" />)}</div><p className="mt-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">Connecting to match server</p></div><SiteFooter /></div>;
}

function MessageState({ icon, title, message, action }: { icon: React.ReactNode; title: string; message: string; action?: () => void }) {
  return <div className="flex min-h-[100dvh] flex-col"><div className="flex items-center justify-between bg-secondary px-4 py-3"><BrandLogo variant="white" className="h-11 w-44" /><StaffAccessLink compact /></div><div className="flex min-h-[55dvh] flex-1 items-center justify-center p-6 text-center"><div className="max-w-md"><div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center bg-secondary text-primary">{icon}</div><p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">Match-day voting</p><h1 className="text-5xl font-black uppercase leading-none tracking-tight">{title}</h1><p className="mt-5 text-sm leading-relaxed text-muted-foreground">{message}</p>{action && <button className="mt-6 bg-primary px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90" onClick={action}>Try again</button>}</div></div><SiteFooter /></div>;
}

function StaffAccessLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/login"
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
        compact
           ? "h-9 border-white/25 bg-white/10 px-3 text-white hover:border-white hover:bg-white hover:text-secondary"
          : "h-10 border-border bg-card px-4 text-foreground shadow-sm hover:border-primary hover:text-primary"
      }`}
    >
      <ShieldCheck size={16} />
      <span>{compact ? "Staff" : "Admin / Staff"}</span>
    </Link>
  );
}