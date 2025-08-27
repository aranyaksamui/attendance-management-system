import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertSubjectSchema, type InsertSubject } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AddSubjectModal() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertSubject>({
    resolver: zodResolver(insertSubjectSchema),
    defaultValues: {
      name: "",
      code: "",
      semesterId: "",
    },
  });

  // Fetch semesters for dropdown
  const { data: semesters } = useQuery({
    queryKey: ['/api/semesters'],
  });

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: async (subjectData: InsertSubject) => {
      return apiRequest("POST", "/api/subjects", subjectData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject created successfully!",
      });
      form.reset();
      setOpen(false);
      // Invalidate subjects queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create subject",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSubject) => {
    createSubjectMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-add-subject">
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="modal-add-subject">
        <DialogHeader>
          <DialogTitle data-testid="title-add-subject">Add New Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-add-subject">
          <div>
            <Label htmlFor="subject-name" data-testid="label-subject-name">Subject Name</Label>
            <Input
              id="subject-name"
              {...form.register("name")}
              placeholder="e.g., Machine Learning"
              data-testid="input-subject-name"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm mt-1" data-testid="error-subject-name">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="subject-code" data-testid="label-subject-code">Subject Code</Label>
            <Input
              id="subject-code"
              {...form.register("code")}
              placeholder="e.g., CS501"
              data-testid="input-subject-code"
            />
            {form.formState.errors.code && (
              <p className="text-destructive text-sm mt-1" data-testid="error-subject-code">
                {form.formState.errors.code.message}
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

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createSubjectMutation.isPending}
              data-testid="button-submit"
            >
              {createSubjectMutation.isPending ? "Creating..." : "Create Subject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}