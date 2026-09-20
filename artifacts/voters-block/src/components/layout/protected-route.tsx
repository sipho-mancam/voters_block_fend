import { useLocation } from "wouter";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useStaffSession } from "@/lib/staff-session";

type ProtectedRouteProps = {
  component: React.ComponentType<any>;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ component: Component, requireAdmin }: ProtectedRouteProps) {
  const { role } = useStaffSession();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!role) setLocation("/login");
    else if (requireAdmin && role !== "ADMIN") setLocation("/dashboard");
  }, [role, requireAdmin, setLocation]);

  if (!role || (requireAdmin && role !== "ADMIN")) return null;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}
