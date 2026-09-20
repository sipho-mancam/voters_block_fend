import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreatePoll, useReplacePlayers, useUpdatePollStatus } from "@workspace/api-client-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parsePlayerCsv, ParsedPlayer } from "@/lib/csv-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const pollSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(160),
  fixture: z.string().min(2, "Fixture must be at least 2 characters").max(200),
  venue: z.string().max(160).optional(),
});

type PollFormValues = z.infer<typeof pollSchema>;

export default function NewPoll() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedPlayers, setParsedPlayers] = useState<ParsedPlayer[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  const createPoll = useCreatePoll();
  const uploadPlayers = useReplacePlayers();
  const updateStatus = useUpdatePollStatus();
  
  const [isDeploying, setIsDeploying] = useState(false);

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      title: "",
      fixture: "",
      venue: "",
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parsePlayerCsv(text);
      
      if (result.error && result.data.length === 0) {
        setCsvError(result.error);
        setParsedPlayers([]);
      } else {
        if (result.error) {
          toast({ title: "Warning", description: result.error, variant: "destructive" });
        }
        setParsedPlayers(result.data);
      }
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: PollFormValues) => {
    if (parsedPlayers.length < 2) {
      toast({
        title: "Insufficient Players",
        description: "Please upload a CSV roster with at least 2 players.",
        variant: "destructive"
      });
      return;
    }

    setIsDeploying(true);

    try {
      // 1. Create Poll
      const poll = await createPoll.mutateAsync({ data });
      
      // 2. Upload Roster
      await uploadPlayers.mutateAsync({ 
        pollId: poll.id, 
        data: { players: parsedPlayers as any } 
      });
      
      // 3. Open Poll Status
      await updateStatus.mutateAsync({
        pollId: poll.id,
        data: { status: "OPEN" }
      });

      toast({
        title: "Session Initialized",
        description: "Poll is now live and accepting votes.",
      });
      setLocation(`/dashboard`);
    } catch (err: any) {
      toast({
        title: "Deployment Failed",
        description: err.message || "An error occurred during initialization.",
        variant: "destructive"
      });
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Initialize Session</h1>
        <p className="text-muted-foreground font-mono">Create a new match voting poll</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="uppercase tracking-tight">Match Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase font-bold text-muted-foreground">Poll Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. MOTM" {...field} className="font-mono h-12 bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fixture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase font-bold text-muted-foreground">Fixture</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Home Team vs Away Team" {...field} className="font-mono h-12 bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase font-bold text-muted-foreground">Venue (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. National Stadium" {...field} className="font-mono h-12 bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                className="w-full h-14 font-bold uppercase tracking-widest clip-diagonal text-lg" 
                disabled={isDeploying || parsedPlayers.length < 2}
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Deploying...
                  </>
                ) : (
                  <>
                    Initialize & Go Live
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <div className="space-y-6">
          <Card className={`border-border transition-colors ${csvError ? 'border-destructive' : parsedPlayers.length > 0 ? 'border-primary' : ''}`}>
            <CardHeader className="pb-4">
              <CardTitle className="uppercase tracking-tight flex items-center justify-between">
                Roster Data
                {parsedPlayers.length > 0 && <span className="bg-primary/20 text-primary text-xs font-mono px-2 py-1 rounded">{parsedPlayers.length} RECORDS</span>}
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                Upload CSV with headers: name, squadNumber, position (opt), team (opt)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              
              {!csvFile ? (
                <div 
                  onClick={triggerFileInput}
                  className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
                >
                  <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                    <Upload size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-bold uppercase tracking-tight text-lg mb-1">Upload CSV</h3>
                  <p className="text-muted-foreground font-mono text-sm">Click to browse files</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <FileText size={24} className={csvError ? "text-destructive" : "text-primary"} />
                      <div>
                        <p className="font-bold text-sm truncate max-w-[200px]">{csvFile.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{(csvFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={triggerFileInput} className="font-mono text-xs uppercase clip-diagonal">
                      Replace
                    </Button>
                  </div>
                  
                  {csvError && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex gap-3 text-sm font-mono border border-destructive/20">
                      <AlertTriangle size={18} className="shrink-0" />
                      {csvError}
                    </div>
                  )}

                  {!csvError && parsedPlayers.length > 0 && (
                    <div className="bg-primary/10 text-primary p-3 rounded-lg flex items-center gap-3 text-sm font-bold uppercase border border-primary/20">
                      <CheckCircle size={18} />
                      Validation Passed
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {parsedPlayers.length > 0 && (
            <Card className="border-border">
              <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border">
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-16 font-mono text-xs uppercase">No.</TableHead>
                        <TableHead className="font-mono text-xs uppercase">Name</TableHead>
                        <TableHead className="font-mono text-xs uppercase">Pos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedPlayers.map((player, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-black">{player.squadNumber}</TableCell>
                          <TableCell className="font-bold uppercase text-sm">{player.name}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{player.position || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
