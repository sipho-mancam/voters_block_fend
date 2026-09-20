import { useParams, Link } from "wouter";
import { useGetPoll, useGetPollResults, useUpdatePollStatus, getPollQr } from "@workspace/api-client-react";
import { Loader2, ArrowLeft, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetCurrentUser } from "@workspace/api-client-react";

export default function PollDetail() {
  const params = useParams();
  const pollId = parseInt(params.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: poll, isLoading: pollLoading } = useGetPoll(pollId, {
    query: {
      enabled: !!pollId && !isNaN(pollId),
      queryKey: [`/api/polls/${pollId}`],
    }
  });

  const { data: results, isLoading: resultsLoading } = useGetPollResults(pollId, {
    query: {
      enabled: !!pollId && !isNaN(pollId),
      queryKey: [`/api/polls/${pollId}/results`],
      refetchInterval: poll?.status === 'OPEN' ? 5000 : false,
    }
  });

  const updateStatus = useUpdatePollStatus();

  const handleStatusChange = (newStatus: "OPEN" | "CLOSED") => {
    updateStatus.mutate(
      { pollId, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: "Status Updated", description: `Poll is now ${newStatus}.` });
          queryClient.invalidateQueries({ queryKey: [`/api/polls/${pollId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/polls/current"] });
        },
        onError: (err) => {
          toast({ title: "Update Failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleDownloadQR = async () => {
    try {
      setIsDownloading(true);
      const blob = await getPollQr(pollId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poll-${pollId}-qr.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      toast({
        title: "Download Failed",
        description: err.message || "Failed to download QR code",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
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
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold uppercase tracking-tight">Poll Not Found</h2>
        <Button asChild variant="link" className="mt-4 font-mono uppercase">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/history">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight leading-none">{poll.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground font-mono">{poll.fixture}</p>
            <div className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded font-mono ${
              poll.status === 'OPEN' ? 'bg-primary/20 text-primary' :
              poll.status === 'CLOSED' ? 'bg-muted text-muted-foreground' :
              'bg-accent text-accent-foreground'
            }`}>
              {poll.status}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="font-bold uppercase tracking-widest clip-diagonal text-xs h-9"
            onClick={handleDownloadQR}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download QR
          </Button>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-2">
            {poll.status === 'DRAFT' && (
              <Button onClick={() => handleStatusChange('OPEN')} disabled={updateStatus.isPending} className="font-bold uppercase tracking-widest clip-diagonal bg-primary text-primary-foreground h-9 text-xs">
                Open Poll
              </Button>
            )}
            {poll.status === 'OPEN' && (
              <Button onClick={() => handleStatusChange('CLOSED')} disabled={updateStatus.isPending} variant="destructive" className="font-bold uppercase tracking-widest clip-diagonal h-9 text-xs">
                Close Poll
              </Button>
            )}
            {poll.status === 'CLOSED' && (
              <Button onClick={() => handleStatusChange('OPEN')} disabled={updateStatus.isPending} variant="secondary" className="font-bold uppercase tracking-widest clip-diagonal h-9 text-xs">
                Reopen Poll
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="uppercase tracking-tight text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                Voting Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : !results || results.results.length === 0 ? (
                <div className="py-12 text-center font-mono text-muted-foreground">No votes recorded yet.</div>
              ) : (
                <div className="space-y-6">
                  {results.results.map((result, idx) => (
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
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="uppercase tracking-tight text-sm text-primary font-bold">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-primary">{poll.voteCount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="uppercase tracking-tight text-sm text-muted-foreground font-bold">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-sm">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Created</span>
                <span className="font-bold">{format(new Date(poll.createdAt), "MMM dd, HH:mm")}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Opened</span>
                <span className="font-bold">{poll.openedAt ? format(new Date(poll.openedAt), "MMM dd, HH:mm") : '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Closed</span>
                <span className="font-bold">{poll.closedAt ? format(new Date(poll.closedAt), "MMM dd, HH:mm") : '-'}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="uppercase tracking-tight text-sm text-muted-foreground font-bold flex items-center justify-between">
                Player Roster
                <span className="bg-muted px-2 py-0.5 rounded font-mono text-xs">{poll.players.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10 shadow-[0_1px_0_hsl(var(--border))]">
                    <TableRow className="border-none">
                      <TableHead className="w-12 font-mono text-[10px] uppercase">No.</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase">Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poll.players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-black text-xs">{player.squadNumber}</TableCell>
                        <TableCell className="font-bold uppercase text-xs">{player.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
