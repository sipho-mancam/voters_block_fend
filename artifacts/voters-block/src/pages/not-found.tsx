import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">404 Error</h1>
          </div>

          <p className="mt-4 text-sm font-mono text-muted-foreground">
            The requested resource was not found on this server.
          </p>

          <Button asChild className="mt-6 w-full font-bold uppercase tracking-widest clip-diagonal">
            <Link href="/">Return to Main Interface</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
