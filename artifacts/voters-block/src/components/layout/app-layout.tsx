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
      <Sidebar variant="inset" className="bg-sidebar">
        <SidebarHeader className="pt-6 pb-4 px-6">
          <BrandLogo className="h-12 w-52" />
          <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Voters Block</p>
        </SidebarHeader>
        
        <SidebarContent className="px-4 mt-6">
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

        <SidebarFooter className="p-4">
          <div className="flex items-center gap-3 px-2 py-3 bg-accent/50 rounded-lg mb-2">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {session.role.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate">{session.displayName}</span>
              <span className="text-xs text-muted-foreground truncate">{session.role === "STAFF" ? "OPERATOR" : session.role}</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 lg:hidden">
          <SidebarTrigger className="-ml-2" />
          <BrandLogo className="ml-2 h-8 w-36" />
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto p-4 md:p-8 max-w-7xl h-full">
            {children}
          </div>
        </main>
        <SiteFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
