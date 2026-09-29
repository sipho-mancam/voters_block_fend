import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2, Users } from "lucide-react";
import QRCode from "qrcode";
import { Link, useParams } from "wouter";
import { candidateSubtitle, getPollDetails, isValidPublicId, publicVotingUrl, votersBlockApi } from "@/lib/backend-api";
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
  const credentials = session.credentials!;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const polls = useQuery({
    queryKey: ["backend", "polls", session.role],
    queryFn: () => votersBlockApi.listPolls(credentials),
    refetchInterval: 5_000,
  });
  const history = useQuery({
    queryKey: ["backend", "polls-history", session.role],
    queryFn: () => votersBlockApi.pollHistory(credentials),
    enabled: !polls.isLoading && !polls.data?.some((item) => item.id === pollId),
    refetchInterval: 15_000,
  });
  const poll = polls.data?.find((item) => item.id === pollId) ?? history.data?.find((item) => item.id === pollId);
  const results = useQuery({
    queryKey: ["backend", "results", pollId, session.role],
    queryFn: () => votersBlockApi.results(pollId, credentials),
    enabled: Number.isInteger(pollId) && Boolean(poll),
    refetchInterval: 5_000,
  });
  const close = useMutation({
    mutationFn: () => votersBlockApi.setActive(credentials, pollId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backend"] });
      toast({ title: "Poll closed", description: "Voting has stopped." });
    },
    onError: (error: Error) => toast({ title: "Update failed", description: error.message, variant: "destructive" }),
  });

  const downloadQr = async () => {
    try {
      if (!poll?.publicId) throw new Error("This poll has no public ID, so a voter link cannot be generated.");
      setDownloading(true);
      const dataUrl = await QRCode.toDataURL(publicVotingUrl(poll.publicId), { width: 1024, margin: 2, errorCorrectionLevel: "H" });
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

  if (polls.isLoading || history.isLoading) return <div className="flex min-h-60 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!poll) return <div className="py-20 text-center"><h2 className="text-2xl font-black uppercase">Poll unavailable</h2><p className="mx-auto mt-2 max-w-md font-mono text-sm text-muted-foreground">{(history.error ?? polls.error)?.message ?? "This poll could not be found in the API response."}</p><Button asChild variant="link" className="mt-4"><Link href="/dashboard">Return to dashboard</Link></Button></div>;

  const candidates = results.data?.candidates ?? poll.candidates;
  const total = results.data?.totalVotes ?? candidates.reduce((sum, item) => sum + item.votes, 0);
  const pollDetails = getPollDetails(results.data ?? poll);

  return (
    <div className="space-y-6 pb-12">
      <div className="broadcast-panel broadcast-rule flex items-start gap-4 p-6 md:p-8"><Button asChild variant="ghost" size="icon" className="shrink-0 text-white hover:bg-white/15 hover:text-white"><Link href="/dashboard"><ArrowLeft /></Link></Button><div><p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Poll details / #{poll.id}</p><h1 className="text-5xl font-black uppercase leading-none tracking-tight text-white md:text-6xl">{pollDetails.name}</h1><p className="mt-4 font-mono text-xs text-white/55">{pollDetails.location ? `${pollDetails.location} · ` : ""}Created {new Date(poll.createdAt).toLocaleString()}</p></div></div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <Button variant="outline" onClick={downloadQr} disabled={downloading || !poll.active || !poll.publicId || !isValidPublicId(poll.publicId)} title={!poll.publicId || !isValidPublicId(poll.publicId) ? "Poll has no valid public ID" : !poll.active ? "This poll is closed" : undefined} className="clip-diagonal uppercase">{downloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />} Download voter QR</Button>
        {isAdmin && <Button variant="destructive" onClick={() => close.mutate()} disabled={close.isPending} className="clip-diagonal uppercase">Close poll</Button>}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-sm border-t-4 border-t-primary xl:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 uppercase"><Users size={19} /> Results</CardTitle></CardHeader><CardContent>{results.isLoading ? <div className="flex min-h-40 items-center justify-center"><Loader2 className="animate-spin" /></div> : <div className="space-y-5">{[...candidates].sort((a, b) => b.votes - a.votes).map((candidate, index) => {
          const percentage = total ? candidate.votes / total * 100 : 0;
          return <div key={candidate.id}><div className="mb-2 flex justify-between"><div><strong className="uppercase">{index + 1}. {candidate.name}</strong><p className="font-mono text-xs text-muted-foreground">{candidateSubtitle(candidate)}</p></div><div className="text-right"><strong>{Math.round(percentage)}%</strong><p className="font-mono text-xs text-muted-foreground">{candidate.votes} votes</p></div></div><Progress value={percentage} /></div>;
        })}</div>}</CardContent></Card>
        <div className="space-y-6">
          <Card className="rounded-sm border-secondary bg-secondary text-white"><CardHeader><CardTitle className="text-sm uppercase text-white/60">Total votes</CardTitle></CardHeader><CardContent><p className="font-display text-7xl font-black leading-none text-white">{total}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm uppercase">Candidates</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Name</TableHead><TableHead>Votes</TableHead></TableRow></TableHeader><TableBody>{candidates.map((candidate, index) => <TableRow key={candidate.id}><TableCell className="font-black">{index + 1}</TableCell><TableCell><strong className="uppercase">{candidate.name}</strong><p className="font-mono text-[10px] text-muted-foreground">{candidateSubtitle(candidate)}</p></TableCell><TableCell>{candidate.votes}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        </div>
      </div>
    </div>
  );
}