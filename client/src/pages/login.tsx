import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { login } from "@/lib/auth";
import { loginSchema, type LoginRequest } from "@shared/schema";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: undefined,
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      const user = await login(data);
      
      toast({
        title: "Login successful",
        description: `Welcome ${user.name}!`,
      });

      if (user.role === 'teacher') {
        setLocation("/teacher-dashboard");
      } else {
        setLocation("/student-dashboard");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md mx-4" data-testid="card-login">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <GraduationCap className="text-primary text-4xl mb-4 mx-auto" data-testid="icon-graduation-cap" />
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-app-title">
              Attendance System
            </h1>
            <p className="text-muted-foreground mt-2" data-testid="text-subtitle">
              Sign in to continue
            </p>
          </div>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-login">
            <div>
              <Label htmlFor="role" data-testid="label-role">User Role</Label>
              <Select 
                onValueChange={(value) => form.setValue("role", value as "teacher" | "student")}
                data-testid="select-role"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher" data-testid="option-teacher">Teacher</SelectItem>
                  <SelectItem value="student" data-testid="option-student">Student</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-destructive text-sm mt-1" data-testid="error-role">
                  {form.formState.errors.role.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email" data-testid="label-email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="Enter your email"
                data-testid="input-email"
              />
              {form.formState.errors.email && (
                <p className="text-destructive text-sm mt-1" data-testid="error-email">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="password" data-testid="label-password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                placeholder="Enter your password"
                data-testid="input-password"
              />
              {form.formState.errors.password && (
                <p className="text-destructive text-sm mt-1" data-testid="error-password">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
