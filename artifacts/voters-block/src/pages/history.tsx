import { useListPolls } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Loader2, PlusSquare, ChevronRight, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function History() {
  const { data: polls, isLoading } = useListPolls();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Poll Archives</h1>
          <p className="text-muted-foreground font-mono">Historical voting sessions</p>
        </div>
        <Link href="/polls/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest clip-diagonal">
          <PlusSquare size={18} />
          Initialize Poll
        </Link>
      </div>

      {!polls || polls.length === 0 ? (
        <div className="text-center py-20 bg-card border rounded-lg">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold uppercase tracking-tight">No History Found</h3>
          <p className="text-muted-foreground font-mono text-sm mt-2">There are no recorded polls in the system yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {polls.map((poll) => (
            <Link key={poll.id} href={`/polls/${poll.id}`}>
              <Card className="hover-elevate cursor-pointer transition-all border-border hover:border-primary/50 group">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg sm:text-xl uppercase tracking-tight group-hover:text-primary transition-colors">
                        {poll.title}
                      </h3>
                      <div className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded font-mono ${
                        poll.status === 'OPEN' ? 'bg-primary/20 text-primary' :
                        poll.status === 'CLOSED' ? 'bg-muted text-muted-foreground' :
                        'bg-accent text-accent-foreground'
                      }`}>
                        {poll.status}
                      </div>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">{poll.fixture}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm w-full sm:w-auto sm:justify-end">
                    <div className="flex flex-col">
                      <span className="font-bold font-mono text-muted-foreground uppercase text-[10px]">Date</span>
                      <span className="font-mono">{format(new Date(poll.createdAt), "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold font-mono text-muted-foreground uppercase text-[10px]">Votes</span>
                      <span className="font-black text-lg leading-none">{poll.voteCount.toLocaleString()}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors hidden sm:block" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
