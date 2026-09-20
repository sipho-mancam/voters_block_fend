import { useGetCurrentUser } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";

type ProtectedRouteProps = {
  component: React.ComponentType<any>;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ component: Component, requireAdmin }: ProtectedRouteProps) {
  const { data: user, isLoading } = useGetCurrentUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (requireAdmin && user.role !== "ADMIN") {
        setLocation("/dashboard");
      }
    }
  }, [isLoading, user, requireAdmin, setLocation]);

  if (isLoading || !user || (requireAdmin && user.role !== "ADMIN")) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}
