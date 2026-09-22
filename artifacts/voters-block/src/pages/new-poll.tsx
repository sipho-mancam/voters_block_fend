import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AlertTriangle, CheckCircle, FileText, Loader2, Plus, Trash2, Upload, Users } from "lucide-react";
import { votersBlockApi } from "@/lib/backend-api";
import { parsePlayerCsv, type ParsedPlayer } from "@/lib/csv-parser";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStaffSession } from "@/lib/staff-session";

type CandidateInput = { name: string; metadata: string };
type CandidateMode = "manual" | "csv";

const emptyCandidate = (): CandidateInput => ({ name: "", metadata: "" });

export default function NewPoll() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [details, setDetails] = useState({ name: "", location: "", image1: "", image2: "" });
  const [mode, setMode] = useState<CandidateMode>("manual");
  const [manualCandidates, setManualCandidates] = useState<CandidateInput[]>([emptyCandidate()]);
  const [file, setFile] = useState<File | null>(null);
  const [players, setPlayers] = useState<ParsedPlayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { credentials } = useStaffSession();

  const csvCandidates = players.map(toCandidatePayload);
  const candidates = mode === "manual"
    ? manualCandidates.filter((candidate) => candidate.name.trim()).map((candidate) => ({ name: candidate.name.trim(), metadata: candidate.metadata.trim() || undefined }))
    : csvCandidates;
  const canCreate = details.name.trim() && details.location.trim() && candidates.length > 0;

  const create = useMutation({
    mutationFn: async () => {
      if (!credentials) throw new Error("Your admin session has expired");
      const poll = await votersBlockApi.createPoll(credentials, {
        active: false,
        name: details.name.trim(),
        location: details.location.trim(),
        ...(details.image1.trim() ? { image1: details.image1.trim() } : {}),
        ...(details.image2.trim() ? { image2: details.image2.trim() } : {}),
      });
      if (mode === "manual") {
        await Promise.all(candidates.map((candidate) => votersBlockApi.addCandidate(credentials, poll.id, candidate)));
      } else {
        await votersBlockApi.addCandidates(credentials, poll.id, candidates);
      }
      await votersBlockApi.setActive(credentials, poll.id, true);
      return poll;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backend"] });
      toast({ title: "Poll created", description: `${details.name.trim()} is live with ${candidates.length} candidates.` });
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

  const updateCandidate = (index: number, field: keyof CandidateInput, value: string) => {
    setManualCandidates((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, [field]: value } : candidate));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div><h1 className="text-3xl font-black uppercase tracking-tight">Create poll</h1><p className="font-mono text-sm text-muted-foreground">Add the new poll details, then enter candidates manually or import them from CSV.</p></div>

      <Card>
        <CardHeader><CardTitle className="uppercase">Poll information</CardTitle><CardDescription>These details are included in the new API poll contract.</CardDescription></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field label="Poll name" required><Input value={details.name} onChange={(event) => setDetails((current) => ({ ...current, name: event.target.value }))} placeholder="Community poll" /></Field>
          <Field label="Location" required><Input value={details.location} onChange={(event) => setDetails((current) => ({ ...current, location: event.target.value }))} placeholder="Main hall" /></Field>
          <Field label="Primary image URL or path"><Input value={details.image1} onChange={(event) => setDetails((current) => ({ ...current, image1: event.target.value }))} placeholder="banner.png" /></Field>
          <Field label="Secondary image URL or path"><Input value={details.image2} onChange={(event) => setDetails((current) => ({ ...current, image2: event.target.value }))} placeholder="map.png" /></Field>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModeCard active={mode === "manual"} icon={<Users />} title="Add manually" description="Enter each candidate's name and optional information." onClick={() => setMode("manual")} />
        <ModeCard active={mode === "csv"} icon={<Upload />} title="Upload CSV" description="Import a prepared candidate list in one step." onClick={() => setMode("csv")} />
      </div>

      {mode === "manual" ? (
        <Card>
          <CardHeader><CardTitle className="uppercase">Manual candidates</CardTitle><CardDescription>Add at least one candidate. Metadata can contain a position, team, number, or other useful detail.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {manualCandidates.map((candidate, index) => (
              <div key={index} className="grid items-end gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto]">
                <Field label={`Candidate ${index + 1} name`} required><Input value={candidate.name} onChange={(event) => updateCandidate(index, "name", event.target.value)} placeholder="Alex Morgan" /></Field>
                <Field label="Metadata"><Input value={candidate.metadata} onChange={(event) => updateCandidate(index, "metadata", event.target.value)} placeholder="Forward · No. 9" /></Field>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove candidate ${index + 1}`} disabled={manualCandidates.length === 1} onClick={() => setManualCandidates((current) => current.filter((_, candidateIndex) => candidateIndex !== index))}><Trash2 size={18} /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setManualCandidates((current) => [...current, emptyCandidate()])}><Plus className="mr-2" size={18} /> Add candidate</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="uppercase">Candidate CSV</CardTitle><CardDescription>Required header: name. Optional: metadata, squadNumber, position, team.</CardDescription></CardHeader>
            <CardContent>
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} />
              <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center rounded-lg border-2 border-dashed p-10 hover:border-primary/60">
                <Upload className="mb-3 text-muted-foreground" /><strong className="uppercase">{file ? "Replace CSV" : "Upload CSV"}</strong><span className="mt-1 font-mono text-xs text-muted-foreground">{file?.name || "Choose a candidate file"}</span>
              </button>
              {error && <div className="mt-4 flex gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle size={18} />{error}</div>}
              {!error && players.length > 0 && <div className="mt-4 flex gap-2 rounded-md border border-primary/20 bg-primary/10 p-3 text-sm font-bold text-primary"><CheckCircle size={18} />{players.length} candidates validated</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 uppercase"><FileText size={18} /> Preview</CardTitle></CardHeader>
            <CardContent className="max-h-[420px] overflow-auto p-0">
              {csvCandidates.length === 0 ? <p className="p-8 text-center font-mono text-sm text-muted-foreground">Upload a CSV to preview candidates.</p> : <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Name</TableHead><TableHead>Metadata</TableHead></TableRow></TableHeader><TableBody>{csvCandidates.map((candidate, index) => <TableRow key={`${candidate.name}-${index}`}><TableCell className="font-black">{index + 1}</TableCell><TableCell className="font-bold uppercase">{candidate.name}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{candidate.metadata || "—"}</TableCell></TableRow>)}</TableBody></Table>}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button className="clip-diagonal min-w-56 uppercase" disabled={!canCreate || create.isPending} onClick={() => create.mutate()}>{create.isPending ? <><Loader2 className="mr-2 animate-spin" /> Creating poll</> : `Create with ${candidates.length} candidate${candidates.length === 1 ? "" : "s"}`}</Button>
      </div>
    </div>
  );
}

function toCandidatePayload(player: ParsedPlayer) {
  return {
    name: player.name.trim(),
    metadata: player.metadata?.trim() || [player.position, player.team, player.squadNumber ? `No. ${player.squadNumber}` : ""].filter(Boolean).join(" · ") || undefined,
  };
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="font-mono text-xs font-bold uppercase text-muted-foreground">{label}{required && <span className="text-primary"> *</span>}</span>{children}</label>;
}

function ModeCard({ active, icon, title, description, onClick }: { active: boolean; icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-lg border p-5 text-left transition-all ${active ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card hover:border-primary/50"}`}><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</div><strong className="uppercase">{title}</strong><p className="mt-1 text-sm text-muted-foreground">{description}</p></button>;
}