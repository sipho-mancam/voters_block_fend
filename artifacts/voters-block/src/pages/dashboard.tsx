import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ExternalLink, Loader2, PlusSquare, Users } from "lucide-react";
import { Link } from "wouter";
import { getPollDetails, votersBlockApi } from "@/lib/backend-api";
import { useStaffSession } from "@/lib/staff-session";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const session = useStaffSession();
  const isAdmin = session.role === "ADMIN";
  const credentials = session.credentials!;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const polls = useQuery({
    queryKey: ["backend", "polls", session.role],
    queryFn: () => votersBlockApi.listPolls(credentials),
    refetchInterval: 5_000,
  });
  const poll = polls.data?.find((item) => item.active) ?? null;
  const results = useQuery({
    queryKey: ["backend", "results", poll?.id, session.role],
    queryFn: () => votersBlockApi.results(poll!.id, credentials),
    enabled: Boolean(poll),
    refetchInterval: 5_000,
  });
  const closePoll = useMutation({
    mutationFn: () => votersBlockApi.setActive(credentials, poll!.id, false),
    onSuccess: () => {
      toast({ title: "Poll closed", description: "The poll is no longer visible to voters." });
      queryClient.invalidateQueries({ queryKey: ["backend"] });
    },
    onError: (error: Error) => toast({ title: "Close failed", description: error.message, variant: "destructive" }),
  });

  if (polls.isLoading) return <CenteredLoader />;
  if (polls.isError) return <Empty title="Backend unavailable" message={(polls.error as Error).message} />;
  const candidates = results.data?.candidates ?? poll?.candidates ?? [];
  const total = results.data?.totalVotes ?? candidates.reduce((sum, item) => sum + item.votes, 0);
  const pollDetails = poll ? getPollDetails(results.data ?? poll) : null;
  return (
    <div className="space-y-10 pb-12">
      {poll && pollDetails ? (
        <section className="space-y-6">
          <div className="broadcast-panel broadcast-rule relative flex flex-col justify-between gap-6 overflow-hidden p-6 sm:flex-row sm:items-end md:p-8">
            <div className="relative z-10"><p className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white/65"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Live poll</p><h1 className="text-5xl font-black uppercase leading-none tracking-tight text-white md:text-6xl">{pollDetails.name}</h1><p className="mt-4 font-mono text-xs text-white/55">{pollDetails.location ? `${pollDetails.location} · ` : ""}Results refresh every five seconds</p></div>
            <div className="relative z-10 flex flex-wrap gap-2">
              {isAdmin && <Button variant="destructive" onClick={() => closePoll.mutate()} disabled={closePoll.isPending} className="clip-diagonal uppercase">{closePoll.isPending && <Loader2 className="mr-2 animate-spin" />}Close poll</Button>}
              <Link href={`/polls/${poll.id}`} className="inline-flex h-10 items-center border border-white/35 px-4 text-xs font-bold uppercase text-white hover:bg-white hover:text-secondary">Details</Link>
              <a href="/" target="_blank" rel="noreferrer" aria-label="Open public voting page" className="inline-flex h-10 w-10 items-center justify-center border border-white/35 text-white hover:bg-white hover:text-secondary"><ExternalLink size={18} /></a>
            </div>
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 right-12 font-display text-[16rem] font-black leading-none text-white/[0.04]">S</span>
        </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="rounded-sm border-t-4 border-t-primary md:col-span-2">
              <CardHeader><CardTitle className="flex items-center justify-between uppercase">Current standings <span className="h-3 w-3 animate-pulse rounded-full bg-primary" /></CardTitle></CardHeader>
              <CardContent>
                {results.isLoading ? <CenteredLoader /> : candidates.length === 0 ? <p className="py-12 text-center font-mono text-muted-foreground">No candidates have been uploaded.</p> : (
                  <div className="space-y-6">{[...candidates].sort((a, b) => b.votes - a.votes).map((candidate, index) => {
                    const percentage = total ? candidate.votes / total * 100 : 0;
                    return <div key={candidate.id}><div className="mb-2 flex items-end justify-between"><div className="flex items-center gap-3"><span className={`flex h-8 w-8 items-center justify-center rounded font-black ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{index + 1}</span><div><p className="font-bold uppercase">{candidate.name}</p><p className="font-mono text-xs text-muted-foreground">{candidate.metadata || "Player"}</p></div></div><div className="text-right"><strong className="text-xl">{Math.round(percentage)}%</strong><p className="font-mono text-xs text-muted-foreground">{candidate.votes} votes</p></div></div><Progress value={percentage} /></div>;
                  })}</div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-sm bg-secondary text-white"><CardHeader><CardTitle className="text-sm uppercase text-white/60">Total votes</CardTitle></CardHeader><CardContent><p className="font-display text-7xl font-black leading-none text-white">{total}</p><p className="mt-5 flex items-center gap-2 font-mono text-xs text-white/50"><Users size={14} className="text-primary" /> LIVE TALLY</p></CardContent></Card>
          </div>
        </section>
      ) : (
        <NoActivePoll isAdmin={isAdmin} />
      )}
    </div>
  );
}

function CenteredLoader() { return <div className="flex min-h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>; }
function Empty({ title, message }: { title: string; message: string }) {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center text-center"><Activity size={48} className="mb-5 text-muted-foreground" /><h2 className="text-3xl font-black uppercase">{title}</h2><p className="mt-2 max-w-md font-mono text-sm text-muted-foreground">{message}</p></div>;
}

function NoActivePoll({ isAdmin }: { isAdmin: boolean }) {
  return <section className="broadcast-panel broadcast-rule flex min-h-[360px] flex-col items-center justify-center p-8 text-center"><Activity size={40} className="mb-5 text-primary" /><p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-white/50">Match-day control</p><h1 className="text-5xl font-black uppercase text-white">No active poll</h1><p className="mt-3 max-w-md text-sm text-white/60">{isAdmin ? "Create a poll and add its candidate list to begin voting." : "There is no live voting session to monitor."}</p>{isAdmin && <Link href="/polls/new" className="clip-diagonal mt-7 inline-flex h-10 items-center gap-2 bg-primary px-4 font-bold uppercase text-primary-foreground"><PlusSquare size={18} /> Create poll</Link>}</section>;
}
