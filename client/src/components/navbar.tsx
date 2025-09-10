import { GraduationCap, LogOut, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout, getCurrentUser } from "@/lib/auth";
import { useLocation } from "wouter";

export default function Navbar() {
  const [, setLocation] = useLocation();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (!user) return null;

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <GraduationCap className="text-primary text-2xl" data-testid="icon-graduation-cap" />
            <h1 className="text-xl font-semibold text-foreground" data-testid="text-app-title">
              Attendance Management
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Navigation Links for Teachers */}
            {user.role === 'teacher' && (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation('/teacher-dashboard')}
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation('/reports')}
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Reports</span>
                </Button>
              </div>
            )}
            
            <span className="text-muted-foreground" data-testid="text-username">
              {user.name}
            </span>
            <Button 
              onClick={handleLogout} 
              variant="destructive"
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
