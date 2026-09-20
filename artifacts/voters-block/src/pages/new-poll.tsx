import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AlertTriangle, CheckCircle, FileText, Loader2, Upload } from "lucide-react";
import { votersBlockApi } from "@/lib/backend-api";
import { parsePlayerCsv, type ParsedPlayer } from "@/lib/csv-parser";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function NewPoll() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [players, setPlayers] = useState<ParsedPlayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: async () => {
      const poll = await votersBlockApi.createPoll(true);
      await votersBlockApi.addCandidates(poll.id, players.map((player) => ({
        name: player.name,
        metadata: [player.position, player.team, player.squadNumber ? `No. ${player.squadNumber}` : ""].filter(Boolean).join(" · "),
      })));
      return poll;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backend"] });
      toast({ title: "Poll created", description: "The player list is uploaded and voting is live." });
      setLocation("/dashboard");
    },
    onError: (cause: Error) => toast({ title: "Creation failed", description: cause.message, variant: "destructive" }),
  });

  const readFile = (selected: File) => {
    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parsePlayerCsv(String(reader.result ?? ""));
      setPlayers(parsed.data);
      setError(parsed.error ?? null);
    };
    reader.onerror = () => setError("The CSV file could not be read");
    reader.readAsText(selected);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div><h1 className="text-3xl font-black uppercase tracking-tight">Create active poll</h1><p className="font-mono text-sm text-muted-foreground">The existing API accepts an active flag and a candidate list; match titles are not part of its contract.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="uppercase">Player CSV</CardTitle><CardDescription>Required headers: name, squadNumber. Optional: position, team.</CardDescription></CardHeader>
          <CardContent>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} />
            <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center rounded-lg border-2 border-dashed p-10 hover:border-primary/60">
              <Upload className="mb-3 text-muted-foreground" /><strong className="uppercase">{file ? "Replace CSV" : "Upload CSV"}</strong><span className="mt-1 font-mono text-xs text-muted-foreground">{file?.name || "Choose a roster file"}</span>
            </button>
            {error && <div className="mt-4 flex gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle size={18} />{error}</div>}
            {!error && players.length > 0 && <div className="mt-4 flex gap-2 rounded-md border border-primary/20 bg-primary/10 p-3 text-sm font-bold text-primary"><CheckCircle size={18} />{players.length} players validated</div>}
            <Button className="clip-diagonal mt-6 w-full uppercase" disabled={players.length === 0 || create.isPending} onClick={() => create.mutate()}>{create.isPending ? <><Loader2 className="mr-2 animate-spin" /> Creating</> : "Create and open poll"}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 uppercase"><FileText size={18} /> Preview</CardTitle></CardHeader>
          <CardContent className="max-h-[480px] overflow-auto p-0">
            {players.length === 0 ? <p className="p-8 text-center font-mono text-sm text-muted-foreground">Upload a CSV to preview candidates.</p> : <Table><TableHeader><TableRow><TableHead>No.</TableHead><TableHead>Name</TableHead><TableHead>Metadata</TableHead></TableRow></TableHeader><TableBody>{players.map((player, index) => <TableRow key={`${player.name}-${index}`}><TableCell className="font-black">{player.squadNumber}</TableCell><TableCell className="font-bold uppercase">{player.name}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{[player.position, player.team].filter(Boolean).join(" · ") || "—"}</TableCell></TableRow>)}</TableBody></Table>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}