import { useEffect } from "react";
import { Eye, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStaffSession, type StaffRole } from "@/lib/staff-session";
import { BrandLogo } from "@/components/brand-logo";

export default function Login() {
  const session = useStaffSession();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (session.role) setLocation("/dashboard");
  }, [session.role, setLocation]);

  const enter = (role: StaffRole) => {
    session.login(role);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-[100dvh] bg-background md:grid md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-secondary p-12 text-secondary-foreground md:flex md:flex-col md:justify-between">
        <BrandLogo variant="white" className="h-16 w-72" />
        <div><h1 className="text-5xl font-black uppercase tracking-tighter">Match-day<br />control room</h1><p className="mt-5 max-w-md font-mono text-sm text-muted-foreground">The connected Spring API uses role headers rather than account authentication. Choose the access level assigned to this workstation.</p></div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-lg">
          <div className="mb-10 md:hidden"><BrandLogo className="h-14 w-64" /></div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Choose control mode</h2>
          <p className="mt-2 font-mono text-sm text-muted-foreground">This selection sets the API’s documented X-User-Role header.</p>
          <div className="mt-8 grid gap-4">
            <RoleCard icon={<ShieldCheck />} title="Administrator" description="Create polls, upload player lists, and open or close voting." action="Enter as admin" onClick={() => enter("ADMIN")} />
            <RoleCard icon={<Eye />} title="Live viewer" description="Monitor active polls and live results without administrative controls." action="Enter as viewer" onClick={() => enter("VIEWER")} />
          </div>
          <p className="mt-6 rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-muted-foreground">This is role selection, not secure authentication. The supplied backend does not expose a login or session endpoint.</p>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, description, action, onClick }: { icon: React.ReactNode; title: string; description: string; action: string; onClick: () => void }) {
  return <Card className="transition-colors hover:border-primary/50"><CardContent className="flex items-center gap-4 p-5"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</div><div className="flex-1"><h3 className="font-bold uppercase">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><Button onClick={onClick} className="clip-diagonal uppercase">{action}</Button></CardContent></Card>;
}