import { useQuery } from "@tanstack/react-query";
import { Archive, Loader2, MapPin } from "lucide-react";
import { Link } from "wouter";
import { getPollDetails, votersBlockApi } from "@/lib/backend-api";
import { useStaffSession } from "@/lib/staff-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PollHistory() {
  const session = useStaffSession();
  const credentials = session.credentials!;
  const polls = useQuery({
    queryKey: ["backend", "polls-history", session.role],
    queryFn: () => votersBlockApi.pollHistory(credentials),
    refetchInterval: 15_000,
  });

  if (polls.isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (polls.isError) return <div className="py-20 text-center"><h1 className="text-3xl font-black uppercase">History unavailable</h1><p className="mt-2 font-mono text-sm text-muted-foreground">{(polls.error as Error).message}</p></div>;

  const previousPolls = (polls.data ?? [])
    .filter((poll) => !poll.active)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 pb-12">
      <div className="broadcast-panel broadcast-rule flex flex-wrap items-end justify-between gap-4 p-6 md:p-8">
        <div><p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">The archive</p><h1 className="flex items-center gap-3 text-5xl font-black uppercase leading-none text-white md:text-6xl"><Archive size={30} className="text-primary" /> Previous polls</h1><p className="mt-3 text-sm text-white/60">Review closed polls and their final voting results.</p></div>
        <span className="border border-white/25 px-3 py-1 font-mono text-xs font-bold uppercase text-white/70">{previousPolls.length} closed</span>
      </div>

      {previousPolls.length === 0 ? (
        <Card><CardContent className="py-20 text-center"><Archive className="mx-auto mb-4 text-muted-foreground" size={40} /><h2 className="text-xl font-black uppercase">No previous polls</h2><p className="mt-2 font-mono text-sm text-muted-foreground">Closed polls will appear here as history.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {previousPolls.map((poll) => {
            const details = getPollDetails(poll);
            const totalVotes = poll.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
            return (
              <Card key={poll.id} className="rounded-sm border-t-4 border-t-primary transition-colors hover:border-primary/60">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Poll #{poll.id} · Closed</p><CardTitle className="mt-1 text-2xl uppercase">{details.name}</CardTitle></div>
                    <span className="rounded-full bg-muted px-2 py-1 font-mono text-[10px] font-bold uppercase text-muted-foreground">History</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 font-mono text-xs text-muted-foreground">
                    {details.location && <p className="flex items-center gap-2"><MapPin size={14} /> {details.location}</p>}
                    <p>{new Date(poll.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-y py-3 text-center">
                    <div><strong className="text-xl">{poll.candidates.length}</strong><p className="font-mono text-[10px] uppercase text-muted-foreground">Candidates</p></div>
                    <div><strong className="text-xl">{totalVotes}</strong><p className="font-mono text-[10px] uppercase text-muted-foreground">Votes</p></div>
                  </div>
                  <Link href={`/polls/${poll.id}`} className="inline-flex h-9 w-full items-center justify-center rounded-md border text-xs font-bold uppercase hover:border-primary hover:text-primary">View results</Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}