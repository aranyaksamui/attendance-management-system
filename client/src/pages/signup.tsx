import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { signupSchema, type SignupRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<SignupRequest>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: undefined,
      rollNo: "",
      employeeId: "",
      batchId: "",
      semesterId: "",
    },
  });

  const watchRole = form.watch("role");

  // Fetch batches and semesters for student signup
  const { data: batches } = useQuery({
    queryKey: ['/api/batches'],
    enabled: watchRole === 'student',
  });

  const { data: semesters } = useQuery({
    queryKey: ['/api/semesters'],
    enabled: watchRole === 'student',
  });

  const onSubmit = async (data: SignupRequest) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest("POST", "/api/signup", data);
      const result = await response.json();
      
      toast({
        title: "Account created successfully",
        description: `Welcome ${result.user.name}! You can now login.`,
      });

      setLocation("/");
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md mx-4" data-testid="card-signup">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <GraduationCap className="text-primary text-4xl mb-4 mx-auto" data-testid="icon-graduation-cap" />
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-app-title">
              Create Account
            </h1>
            <p className="text-muted-foreground mt-2" data-testid="text-subtitle">
              Join the attendance system
            </p>
          </div>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-signup">
            <div>
              <Label htmlFor="name" data-testid="label-name">Full Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter your full name"
                data-testid="input-name"
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-sm mt-1" data-testid="error-name">
                  {form.formState.errors.name.message}
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
                placeholder="Enter password (min 6 characters)"
                data-testid="input-password"
              />
              {form.formState.errors.password && (
                <p className="text-destructive text-sm mt-1" data-testid="error-password">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="role" data-testid="label-role">I am a</Label>
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

            {watchRole === 'teacher' && (
              <div>
                <Label htmlFor="employeeId" data-testid="label-employee-id">Employee ID</Label>
                <Input
                  id="employeeId"
                  {...form.register("employeeId")}
                  placeholder="Enter your employee ID"
                  data-testid="input-employee-id"
                />
                {form.formState.errors.employeeId && (
                  <p className="text-destructive text-sm mt-1" data-testid="error-employee-id">
                    {form.formState.errors.employeeId.message}
                  </p>
                )}
              </div>
            )}

            {watchRole === 'student' && (
              <>
                <div>
                  <Label htmlFor="rollNo" data-testid="label-roll-no">Roll Number</Label>
                  <Input
                    id="rollNo"
                    {...form.register("rollNo")}
                    placeholder="Enter your roll number"
                    data-testid="input-roll-no"
                  />
                  {form.formState.errors.rollNo && (
                    <p className="text-destructive text-sm mt-1" data-testid="error-roll-no">
                      {form.formState.errors.rollNo.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="batch" data-testid="label-batch">Batch</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("batchId", value)}
                    data-testid="select-batch"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(batches) && batches.map((batch: any) => (
                        <SelectItem key={batch.id} value={batch.id} data-testid={`option-batch-${batch.year}`}>
                          Batch {batch.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.batchId && (
                    <p className="text-destructive text-sm mt-1" data-testid="error-batch">
                      {form.formState.errors.batchId.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="semester" data-testid="label-semester">Semester</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("semesterId", value)}
                    data-testid="select-semester"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(semesters) && semesters.map((semester: any) => (
                        <SelectItem key={semester.id} value={semester.id} data-testid={`option-semester-${semester.number}`}>
                          Semester {semester.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.semesterId && (
                    <p className="text-destructive text-sm mt-1" data-testid="error-semester">
                      {form.formState.errors.semesterId.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {form.formState.errors.root && (
              <p className="text-destructive text-sm mt-1" data-testid="error-form">
                {form.formState.errors.root.message}
              </p>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/")}
                  className="text-primary hover:underline"
                  data-testid="link-login"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}