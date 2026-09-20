import { useGetCurrentPoll, useGetPollResults, useUpdatePollStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Loader2, PlusSquare, Users, Activity, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: user } = useGetCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: poll, isLoading: pollLoading } = useGetCurrentPoll();
  
  // Only fetch results if there is an active poll
  const { data: results, isLoading: resultsLoading } = useGetPollResults(
    poll?.id as number,
    {
      query: {
        enabled: !!poll?.id,
        queryKey: [`/api/polls/${poll?.id}/results`],
        refetchInterval: 5000, // Live updates every 5 seconds
      }
    }
  );

  const updateStatus = useUpdatePollStatus();

  const handleClosePoll = () => {
    if (!poll) return;
    updateStatus.mutate(
      { pollId: poll.id, data: { status: "CLOSED" } },
      {
        onSuccess: () => {
          toast({ title: "Poll Closed", description: "Voting has been stopped." });
          queryClient.invalidateQueries({ queryKey: ["/api/polls/current"] });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  if (pollLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <Activity size={40} className="text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight mb-2">No Active Session</h2>
        <p className="text-muted-foreground font-mono mb-8 max-w-md">
          There is no live voting session running on the network. 
          {isAdmin && " Create a new poll to begin capturing fan votes."}
        </p>
        
        {isAdmin && (
          <Link href="/polls/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest clip-diagonal">
            <PlusSquare size={18} />
            Initialize Poll
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Live Telemetry</h1>
          <p className="text-muted-foreground font-mono">Monitoring real-time voting data</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="destructive" className="uppercase font-bold tracking-wider clip-diagonal" onClick={handleClosePoll} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Close Poll
            </Button>
          )}
          <Link href={`/polls/${poll.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 uppercase tracking-wider font-bold clip-diagonal">
            Details
          </Link>
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10 clip-diagonal" title="Open Public Page">
            <ExternalLink size={18} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="uppercase tracking-tight text-xl font-bold flex items-center justify-between">
              {poll.title}
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </CardTitle>
            <CardDescription className="font-mono">{poll.fixture} {poll.venue && `• ${poll.venue}`}</CardDescription>
          </CardHeader>
          <CardContent>
            {resultsLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : results?.results.length === 0 ? (
              <div className="py-12 text-center font-mono text-muted-foreground">No votes registered yet. Awaiting incoming data.</div>
            ) : (
              <div className="space-y-6">
                {results?.results.map((result, idx) => (
                  <div key={result.playerId} className="relative">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded bg-muted flex items-center justify-center font-black ${idx === 0 ? 'bg-primary text-primary-foreground' : ''}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-bold uppercase text-sm md:text-base leading-none block">{result.playerName}</span>
                          <span className="font-mono text-xs text-muted-foreground block mt-1">NO. {result.squadNumber}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-xl leading-none">{Math.round(result.percentage)}%</span>
                        <span className="block text-xs font-mono text-muted-foreground mt-1">{result.votes.toLocaleString()} votes</span>
                      </div>
                    </div>
                    <Progress value={result.percentage} className={`h-2 ${idx === 0 ? '[&>div]:bg-primary' : '[&>div]:bg-muted-foreground'}`} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="uppercase tracking-tight text-sm text-muted-foreground font-bold">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black">{results?.totalVotes.toLocaleString() || "0"}</div>
              <div className="mt-2 text-xs font-mono text-muted-foreground flex items-center gap-2">
                <Users size={14} /> LIVE TALLY
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="uppercase tracking-tight text-sm text-muted-foreground font-bold">Time Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-2xl font-bold">
                {poll.openedAt ? (
                  (() => {
                    const diff = Math.floor((new Date().getTime() - new Date(poll.openedAt).getTime()) / 60000);
                    const hrs = Math.floor(diff / 60);
                    const mins = diff % 60;
                    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} MINS`;
                  })()
                ) : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
