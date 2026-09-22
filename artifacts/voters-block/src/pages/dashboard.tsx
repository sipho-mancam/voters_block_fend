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
    queryKey: ["backend", "active-polls", session.role],
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
  if (!poll) return <Empty title="No active poll" message={isAdmin ? "Create a poll and upload its player list to begin voting." : "There is no live voting session to monitor."} admin={isAdmin} />;

  const candidates = results.data?.candidates ?? poll.candidates;
  const total = results.data?.totalVotes ?? candidates.reduce((sum, item) => sum + item.votes, 0);
  const pollDetails = getPollDetails(results.data ?? poll);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-3xl font-black uppercase tracking-tight">{pollDetails.name}</h1><p className="font-mono text-sm text-muted-foreground">{pollDetails.location ? `${pollDetails.location} · ` : ""}Refreshing from the Spring API every five seconds</p></div>
        <div className="flex gap-2">
          {isAdmin && <Button variant="destructive" onClick={() => closePoll.mutate()} disabled={closePoll.isPending} className="clip-diagonal uppercase">{closePoll.isPending && <Loader2 className="mr-2 animate-spin" />}Close poll</Button>}
          <Link href={`/polls/${poll.id}`} className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-bold uppercase">Details</Link>
          <a href="/" target="_blank" rel="noreferrer" aria-label="Open public voting page" className="inline-flex h-10 w-10 items-center justify-center rounded-md border"><ExternalLink size={18} /></a>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
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
        <Card><CardHeader><CardTitle className="text-sm uppercase text-muted-foreground">Total votes</CardTitle></CardHeader><CardContent><p className="text-5xl font-black">{total}</p><p className="mt-2 flex items-center gap-2 font-mono text-xs text-muted-foreground"><Users size={14} /> LIVE TALLY</p></CardContent></Card>
      </div>
    </div>
  );
}

function CenteredLoader() { return <div className="flex min-h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>; }
function Empty({ title, message, admin }: { title: string; message: string; admin?: boolean }) {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center text-center"><Activity size={48} className="mb-5 text-muted-foreground" /><h2 className="text-3xl font-black uppercase">{title}</h2><p className="mt-2 max-w-md font-mono text-sm text-muted-foreground">{message}</p>{admin && <Link href="/polls/new" className="clip-diagonal mt-7 inline-flex h-10 items-center gap-2 bg-primary px-4 font-bold uppercase text-primary-foreground"><PlusSquare size={18} /> Create poll</Link>}</div>;
}