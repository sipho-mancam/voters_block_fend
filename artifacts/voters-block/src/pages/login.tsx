import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, useGetCurrentUser } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  if (user && !userLoading) {
    setLocation("/dashboard");
    return null;
  }

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Access Granted",
            description: "Welcome to Voters Block control center.",
          });
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({
            title: "Authentication Failed",
            description: error?.message || "Invalid credentials.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Visual Section */}
      <div className="hidden md:flex flex-1 bg-secondary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjIiIGN5PSIyMiIgcj0iMSIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] [background-size:24px_24px]"></div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-3 rounded-lg clip-diagonal">
            <Trophy size={32} className="stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter uppercase text-secondary-foreground leading-none">Voters</span>
            <span className="font-black text-2xl tracking-tighter uppercase text-primary leading-none">Block</span>
          </div>
        </div>
        
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl md:text-5xl font-black text-secondary-foreground leading-tight uppercase tracking-tighter mb-4">
            Broadcast-Ready<br/>Fan Engagement
          </h1>
          <p className="text-muted-foreground font-mono text-sm leading-relaxed">
            SYSTEM STATUS: SECURE.<br/>
            AWAITING OPERATOR AUTHENTICATION.<br/>
            LIVE VOTING CONTROL SURFACES.
          </p>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-3 mb-12 justify-center">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg clip-diagonal">
              <Trophy size={24} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter uppercase text-foreground leading-none">Voters</span>
              <span className="font-black text-xl tracking-tighter uppercase text-primary leading-none">Block</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">Operator Login</h2>
            <div className="h-1 w-12 bg-primary mb-4 clip-diagonal"></div>
            <p className="text-muted-foreground text-sm font-mono">Enter credentials to access the control panel.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase font-bold text-muted-foreground">Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="operator_1" 
                        {...field} 
                        className="font-mono h-12 bg-muted/50 border-muted focus-visible:ring-primary focus-visible:border-primary"
                        autoComplete="username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase font-bold text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="font-mono h-12 bg-muted/50 border-muted focus-visible:ring-primary focus-visible:border-primary"
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 font-bold uppercase tracking-widest clip-diagonal hover-elevate transition-all" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Authenticate"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
