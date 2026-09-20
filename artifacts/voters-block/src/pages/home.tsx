import { useState } from "react";
import { useGetActivePoll, useSubmitVote, getGetActivePollQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeviceId } from "@/hooks/use-device-id";
import { Loader2, Check, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function PublicVoting() {
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: poll, isLoading, error } = useGetActivePoll(
    { deviceId },
    {
      query: {
        enabled: !!deviceId,
        queryKey: getGetActivePollQueryKey({ deviceId }),
        refetchInterval: 30000, // Check for updates every 30s
      }
    }
  );

  const submitVote = useSubmitVote();
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  if (!deviceId || isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <div className="font-mono text-sm text-muted-foreground uppercase tracking-widest animate-pulse">Initializing Terminal...</div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-secondary text-secondary-foreground w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
            <Trophy size={40} className="opacity-50" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">No Active Poll</h1>
          <p className="text-muted-foreground font-mono mb-8">There is currently no Man of the Match voting session open. Please check back during the match.</p>
        </div>
      </div>
    );
  }

  const handleVote = (playerId: number) => {
    setSelectedPlayerId(playerId);
    submitVote.mutate(
      { pollId: poll.id, data: { deviceId, playerId } },
      {
        onSuccess: (receipt) => {
          // Optimistically update the active poll query to show the new vote
          queryClient.setQueryData(getGetActivePollQueryKey({ deviceId }), (old: any) => {
            if (!old) return old;
            return { ...old, currentPlayerId: receipt.playerId };
          });
          toast({
            title: "Vote Recorded",
            description: "Your selection has been securely registered.",
          });
          setSelectedPlayerId(null);
        },
        onError: (err) => {
          toast({
            title: "Transmission Failed",
            description: err.message || "Unable to register vote.",
            variant: "destructive",
          });
          setSelectedPlayerId(null);
        }
      }
    );
  };

  const hasVoted = poll.currentPlayerId !== null && poll.currentPlayerId !== undefined;
  const currentSelectedId = selectedPlayerId || poll.currentPlayerId;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground p-4 md:p-6 sticky top-0 z-10 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-sm clip-diagonal">
              <Trophy size={20} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight uppercase leading-none">Man of the</span>
              <span className="font-bold text-sm tracking-tight uppercase text-primary leading-none">Match</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Live
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6 pb-24">
        <div className="mb-8 text-center mt-4">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2 leading-tight">{poll.title}</h1>
          <p className="text-muted-foreground font-mono font-bold">{poll.fixture}</p>
        </div>

        {hasVoted && (
          <div className="bg-primary/10 border border-primary/20 text-foreground p-4 rounded-lg mb-8 flex items-start gap-4">
            <div className="bg-primary text-primary-foreground p-2 rounded-full mt-1">
              <Check size={20} className="stroke-[3]" />
            </div>
            <div>
              <h3 className="font-bold uppercase tracking-tight text-lg">Vote Registered</h3>
              <p className="text-sm font-mono text-muted-foreground">Your vote is locked in. You can change your selection until the poll closes.</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {poll.players.map((player) => {
            const isSelected = currentSelectedId === player.id;
            const isPending = submitVote.isPending && selectedPlayerId === player.id;

            return (
              <Card 
                key={player.id} 
                className={`overflow-hidden transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'border-primary ring-1 ring-primary shadow-md bg-primary/5' 
                    : 'hover:border-foreground/30 hover-elevate'
                }`}
                onClick={() => {
                  if (!isPending && currentSelectedId !== player.id) {
                    handleVote(player.id);
                  }
                }}
              >
                <CardContent className="p-0 flex items-stretch">
                  <div className={`w-16 flex items-center justify-center font-black text-2xl border-r ${
                    isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {player.squadNumber}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-center">
                    <h3 className={`font-bold text-lg uppercase tracking-tight leading-tight ${isSelected ? 'text-primary' : ''}`}>
                      {player.name}
                    </h3>
                    <div className="flex gap-3 text-xs font-mono text-muted-foreground mt-1">
                      {player.position && <span>{player.position}</span>}
                      {player.team && <span>{player.team}</span>}
                    </div>
                  </div>
                  <div className="w-16 flex items-center justify-center">
                    {isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : isSelected ? (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                        <Check size={16} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
