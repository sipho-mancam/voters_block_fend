import { Link, useLocation } from "wouter";
import { useGetCurrentUser, useLogout } from "@workspace/api-client-react";
import { LayoutDashboard, History, PlusSquare, LogOut, Loader2, Trophy } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useGetCurrentUser();
  const logoutMutation = useLogout();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
      },
      onError: (err) => {
        toast({
          title: "Logout failed",
          description: err.message || "An error occurred",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // If not logged in, they shouldn't be inside AppLayout. Redirect to login handled by protected route.
    return null;
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="bg-sidebar">
        <SidebarHeader className="pt-6 pb-4 px-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-md">
              <Trophy size={24} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight uppercase leading-none">Voters</span>
              <span className="font-bold text-lg tracking-tight uppercase text-muted-foreground leading-none">Block</span>
            </div>
          </div>
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
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/history"} tooltip="Poll History">
                    <Link href="/history" className="flex items-center gap-3">
                      <History />
                      <span className="font-medium">History</span>
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
                {user.displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate">{user.displayName}</span>
              <span className="text-xs text-muted-foreground truncate">{user.role}</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 lg:hidden">
          <SidebarTrigger className="-ml-2" />
          <div className="font-bold text-sm tracking-tight uppercase ml-2 flex items-center gap-2">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-sm flex items-center justify-center">
              <Trophy size={14} className="stroke-[2.5]" />
            </div>
            Voters Block
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto p-4 md:p-8 max-w-7xl h-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
