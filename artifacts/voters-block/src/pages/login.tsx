import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck, Users } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useStaffSession, type StaffCredentials, type StaffRole } from "@/lib/staff-session";
import { votersBlockApi } from "@/lib/backend-api";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export default function Login() {
  const session = useStaffSession();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);
  const [credentials, setCredentials] = useState<StaffCredentials>({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (session.role) setLocation("/dashboard");
  }, [session.role, setLocation]);

  const authenticate = useMutation({
    mutationFn: () => votersBlockApi.authenticate(credentials),
    onSuccess: () => {
      if (!selectedRole) return;
      session.login({ role: selectedRole, credentials });
      setLocation("/dashboard");
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedRole && credentials.username.trim() && credentials.password) authenticate.mutate();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="flex-1 md:grid md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-secondary p-12 text-secondary-foreground md:flex md:flex-col md:justify-between">
        <BrandLogo variant="white" className="h-16 w-72" />
        <div><h1 className="text-5xl font-black uppercase tracking-tighter">Match-day<br />control room</h1></div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-lg">
          <div className="mb-10 md:hidden"><BrandLogo className="h-14 w-64" /></div>
          {!selectedRole ? (
            <>
              <h2 className="text-3xl font-black uppercase tracking-tight">Staff access</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <AccessCard icon={<ShieldCheck />} title="Admin" description="Create polls, upload candidates, and control voting." onClick={() => setSelectedRole("ADMIN")} />
                <AccessCard icon={<Users />} title="Staff" description="Monitor active polls and live match results." onClick={() => setSelectedRole("STAFF")} />
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setSelectedRole(null); authenticate.reset(); }} className="mb-7 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-muted-foreground hover:text-primary"><ArrowLeft size={15} /> Change access area</button>
              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">{selectedRole === "ADMIN" ? <ShieldCheck /> : <Users />}</div>
                <div><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">{selectedRole} access</p><h2 className="text-3xl font-black uppercase tracking-tight">Sign in</h2></div>
              </div>
              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="username" className="font-mono text-xs font-bold uppercase text-muted-foreground">Username</label>
                  <Input id="username" autoComplete="username" value={credentials.username} onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))} className="h-12" required autoFocus />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="font-mono text-xs font-bold uppercase text-muted-foreground">Password</label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={credentials.password} onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} className="h-12 pr-12" required />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>
                {authenticate.isError && <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 font-mono text-xs text-destructive">{authErrorMessage(authenticate.error)}</div>}
                <Button type="submit" className="clip-diagonal h-12 w-full uppercase" disabled={authenticate.isPending || !credentials.username.trim() || !credentials.password}>
                  {authenticate.isPending ? <><Loader2 className="mr-2 animate-spin" /> Authenticating</> : `Sign in to ${selectedRole.toLowerCase()}`}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function AccessCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return <Card role="button" tabIndex={0} onClick={onClick} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onClick(); }} className="cursor-pointer transition-all hover:border-primary hover:shadow-md"><CardContent className="p-6"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</div><h3 className="text-xl font-black uppercase">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{description}</p><span className="mt-5 inline-block font-mono text-xs font-bold uppercase text-primary">Continue →</span></CardContent></Card>;
}

function authErrorMessage(error: Error) {
  if (error.message === "Request failed (401)") return "Incorrect username or password.";
  return "Sign-in is currently unavailable. Please try again.";
}