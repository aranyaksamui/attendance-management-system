import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Login from "@/pages/login";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import NotFound from "@/pages/not-found";
import { getCurrentUser } from "@/lib/auth";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const [, setLocation] = useLocation();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      setLocation("/");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      setLocation("/");
      return;
    }
  }, [user, allowedRoles, setLocation]);

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/teacher-dashboard">
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/student-dashboard">
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
