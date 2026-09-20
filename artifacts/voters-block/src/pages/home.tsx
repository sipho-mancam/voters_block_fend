import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Trophy, WifiOff } from "lucide-react";
import { votersBlockApi } from "@/lib/backend-api";
import { useDeviceId } from "@/hooks/use-device-id";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function PublicVoting() {
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingCandidate, setPendingCandidate] = useState<number | null>(null);
  const [currentVote, setCurrentVote] = useState<number | null>(() => {
    const value = window.localStorage.getItem("voters-block-current-vote");
    return value ? Number(value) : null;
  });

  const pollsQuery = useQuery({
    queryKey: ["backend", "active-polls", "voter"],
    queryFn: () => votersBlockApi.listPolls("VOTER"),
    refetchInterval: 15_000,
    retry: 1,
  });
  const poll = pollsQuery.data?.find((item) => item.active) ?? null;

  useEffect(() => {
    if (!poll || currentVote === null) return;
    const belongsToPoll = poll.candidates.some((candidate) => candidate.id === currentVote);
    if (!belongsToPoll) {
      setCurrentVote(null);
      window.localStorage.removeItem("voters-block-current-vote");
    }
  }, [poll, currentVote]);

  const voteMutation = useMutation({
    mutationFn: ({ pollId, candidateId }: { pollId: number; candidateId: number }) => {
      if (!deviceId) throw new Error("Device identifier is not ready");
      return votersBlockApi.vote(pollId, candidateId, deviceId);
    },
    onSuccess: (receipt) => {
      setCurrentVote(receipt.candidateId);
      window.localStorage.setItem("voters-block-current-vote", String(receipt.candidateId));
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
    return (
      <MessageState
        icon={<WifiOff size={38} />}
        title="Voting service unavailable"
        message="We could not reach the match voting server. Check your connection and try again."
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

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-10 bg-secondary p-4 text-secondary-foreground shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="clip-diagonal rounded-sm bg-primary p-2 text-primary-foreground"><Trophy size={20} /></div>
            <div className="flex flex-col text-sm font-bold uppercase leading-none">
              <span>Man of the</span><span className="text-primary">Match</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 font-mono text-xs font-bold uppercase text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Live
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 pb-24 md:p-6">
        <div className="mb-8 mt-4 text-center">
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Poll #{poll.id}</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter md:text-5xl">Choose your player</h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">Your latest selection replaces your previous vote.</p>
        </div>

        {currentVote !== null && (
          <div className="mb-6 flex gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
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
                className={`cursor-pointer overflow-hidden transition-all ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30"}`}
              >
                <CardContent className="flex items-stretch p-0">
                  <div className={`flex w-16 items-center justify-center border-r text-2xl font-black ${selected ? "border-primary bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{index + 1}</div>
                  <div className="flex-1 p-4">
                    <h2 className="text-lg font-bold uppercase tracking-tight">{candidate.name}</h2>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{candidate.metadata || "Player"}</p>
                  </div>
                  <div className="flex w-16 items-center justify-center">
                    {pending ? <Loader2 className="animate-spin text-primary" /> : selected ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check size={17} /></span> : <span className="h-8 w-8 rounded-full border-2 border-muted-foreground/30" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function LoadingState() {
  return <div className="flex min-h-[100dvh] flex-col items-center justify-center"><Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" /><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Connecting to match server</p></div>;
}

function MessageState({ icon, title, message, action }: { icon: React.ReactNode; title: string; message: string; action?: () => void }) {
  return <div className="flex min-h-[100dvh] items-center justify-center p-6 text-center"><div className="max-w-md"><div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-secondary-foreground/50">{icon}</div><h1 className="text-3xl font-black uppercase tracking-tight">{title}</h1><p className="mt-3 font-mono text-sm text-muted-foreground">{message}</p>{action && <button className="mt-6 font-mono text-sm font-bold uppercase text-primary underline" onClick={action}>Try again</button>}</div></div>;
}