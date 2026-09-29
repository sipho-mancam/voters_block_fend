import { Link, useLocation } from "wouter";
import { Archive, LayoutDashboard, PlusSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStaffSession } from "@/lib/staff-session";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export function AppLayout({ children }: { children: ReactNode }) {
  const session = useStaffSession();
  const [location, setLocation] = useLocation();
  const handleLogout = () => {
    session.logout();
    setLocation("/login");
  };

  if (!session.role) return null;

  const isAdmin = session.role === "ADMIN";

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="border-b border-sidebar-border px-6 pb-6 pt-7">
          <BrandLogo variant="white" className="h-14 w-52" />
          <p className="mt-4 border-l-2 border-primary pl-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Voters Block / Control room</p>
        </SidebarHeader>
        
        <SidebarContent className="mt-7 px-4">
          <p className="mb-3 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Workspace</p>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/dashboard"} tooltip="Dashboard">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <LayoutDashboard />
                  <span className="font-medium">Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/polls/history"} tooltip="Previous Polls">
                <Link href="/polls/history" className="flex items-center gap-3">
                  <Archive />
                  <span className="font-medium">Previous Polls</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {isAdmin && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/polls/new"} tooltip="Create Poll">
                    <Link href="/polls/new" className="flex items-center gap-3">
                      <PlusSquare />
                      <span className="font-medium">Create Poll</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
              </>
            )}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="mb-2 flex items-center gap-3 rounded-md bg-white/7 px-2 py-3">
            <Avatar className="h-9 w-9 border border-white/20">
              <AvatarFallback className="bg-primary/20 font-bold text-white">
                {session.role.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate">{session.displayName}</span>
              <span className="truncate font-mono text-[10px] uppercase tracking-widest text-white/50">{session.role === "STAFF" ? "OPERATOR" : session.role}</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white/65 hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/15 bg-secondary px-6 text-white lg:hidden">
          <SidebarTrigger className="-ml-2" />
          <BrandLogo variant="white" className="ml-2 h-10 w-40" />
        </header>
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto p-4 md:p-8 max-w-7xl h-full">
            {children}
          </div>
        </main>
        <SiteFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
