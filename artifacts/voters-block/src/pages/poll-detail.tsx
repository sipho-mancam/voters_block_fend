import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2, Users } from "lucide-react";
import QRCode from "qrcode";
import { Link, useParams } from "wouter";
import { publicVotingUrl, votersBlockApi } from "@/lib/backend-api";
import { useStaffSession } from "@/lib/staff-session";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PollDetail() {
  const pollId = Number(useParams().id);
  const session = useStaffSession();
  const isAdmin = session.role === "ADMIN";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const polls = useQuery({
    queryKey: ["backend", "active-polls", session.role],
    queryFn: () => votersBlockApi.listPolls(session.role ?? "VIEWER"),
    refetchInterval: 5_000,
  });
  const poll = polls.data?.find((item) => item.id === pollId);
  const results = useQuery({
    queryKey: ["backend", "results", pollId, session.role],
    queryFn: () => votersBlockApi.results(pollId, session.role ?? "VIEWER"),
    enabled: Number.isInteger(pollId) && Boolean(poll),
    refetchInterval: 5_000,
  });
  const close = useMutation({
    mutationFn: () => votersBlockApi.setActive(pollId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backend"] });
      toast({ title: "Poll closed", description: "Voting has stopped." });
    },
    onError: (error: Error) => toast({ title: "Update failed", description: error.message, variant: "destructive" }),
  });

  const downloadQr = async () => {
    try {
      setDownloading(true);
      const dataUrl = await QRCode.toDataURL(publicVotingUrl(), { width: 1024, margin: 2, errorCorrectionLevel: "H" });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `voters-block-poll-${pollId}.png`;
      anchor.click();
    } catch (error) {
      toast({ title: "QR generation failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (polls.isLoading) return <div className="flex min-h-60 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!poll) return <div className="py-20 text-center"><h2 className="text-2xl font-black uppercase">Poll unavailable</h2><p className="mx-auto mt-2 max-w-md font-mono text-sm text-muted-foreground">The supplied API only lists active polls, so closed polls cannot be retrieved.</p><Button asChild variant="link" className="mt-4"><Link href="/dashboard">Return to dashboard</Link></Button></div>;

  const candidates = results.data?.candidates ?? poll.candidates;
  const total = results.data?.totalVotes ?? candidates.reduce((sum, item) => sum + item.votes, 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4"><Button asChild variant="ghost" size="icon"><Link href="/dashboard"><ArrowLeft /></Link></Button><div><h1 className="text-3xl font-black uppercase tracking-tight">Poll #{poll.id}</h1><p className="font-mono text-sm text-muted-foreground">Created {new Date(poll.createdAt).toLocaleString()}</p></div></div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <Button variant="outline" onClick={downloadQr} disabled={downloading} className="clip-diagonal uppercase">{downloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />} Download voter QR</Button>
        {isAdmin && <Button variant="destructive" onClick={() => close.mutate()} disabled={close.isPending} className="clip-diagonal uppercase">Close poll</Button>}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 uppercase"><Users size={19} /> Results</CardTitle></CardHeader><CardContent>{results.isLoading ? <div className="flex min-h-40 items-center justify-center"><Loader2 className="animate-spin" /></div> : <div className="space-y-5">{[...candidates].sort((a, b) => b.votes - a.votes).map((candidate, index) => {
          const percentage = total ? candidate.votes / total * 100 : 0;
          return <div key={candidate.id}><div className="mb-2 flex justify-between"><div><strong className="uppercase">{index + 1}. {candidate.name}</strong><p className="font-mono text-xs text-muted-foreground">{candidate.metadata || "Player"}</p></div><div className="text-right"><strong>{Math.round(percentage)}%</strong><p className="font-mono text-xs text-muted-foreground">{candidate.votes} votes</p></div></div><Progress value={percentage} /></div>;
        })}</div>}</CardContent></Card>
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5"><CardHeader><CardTitle className="text-sm uppercase text-primary">Total votes</CardTitle></CardHeader><CardContent><p className="text-5xl font-black text-primary">{total}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm uppercase">Candidates</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Name</TableHead><TableHead>Votes</TableHead></TableRow></TableHeader><TableBody>{candidates.map((candidate, index) => <TableRow key={candidate.id}><TableCell className="font-black">{index + 1}</TableCell><TableCell><strong className="uppercase">{candidate.name}</strong><p className="font-mono text-[10px] text-muted-foreground">{candidate.metadata}</p></TableCell><TableCell>{candidate.votes}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        </div>
      </div>
    </div>
  );
}