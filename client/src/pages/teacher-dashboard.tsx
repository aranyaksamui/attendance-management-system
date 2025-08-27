import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Search, SquareCheck, Save, UserCheck, UserX, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/navbar";

interface Student {
  id: string;
  rollNo: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent';
}

export default function TeacherDashboard() {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [showStudents, setShowStudents] = useState(false);

  const { toast } = useToast();
  const user = getCurrentUser();

  // Fetch batches
  const { data: batches } = useQuery({
    queryKey: ['/api/batches'],
    enabled: !!user,
  });

  // Fetch semesters
  const { data: semesters } = useQuery({
    queryKey: ['/api/semesters'],
    enabled: !!user,
  });

  // Fetch subjects based on selected semester
  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects', selectedSemester],
    enabled: !!selectedSemester,
  });

  // Fetch students based on batch and semester
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students', selectedBatch, selectedSemester],
    enabled: !!selectedBatch && !!selectedSemester,
  });

  // Fetch existing attendance
  const { data: existingAttendance } = useQuery({
    queryKey: ['/api/attendance', selectedDate, selectedSubject],
    enabled: !!selectedDate && !!selectedSubject,
  });

  // Save attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: AttendanceRecord[]) => {
      const teacher = await getCurrentUser()?.teacher;
      const records = attendanceData.map(record => ({
        studentId: record.studentId,
        subjectId: selectedSubject,
        teacherId: teacher?.id,
        date: selectedDate,
        status: record.status,
      }));

      return apiRequest("POST", "/api/attendance/bulk", { attendanceRecords: records });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
    },
  });

  // Load attendance when date and subject are selected
  const handleLoadAttendance = () => {
    if (!selectedBatch || !selectedSemester || !selectedSubject || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please select all required fields",
        variant: "destructive",
      });
      return;
    }
    setShowStudents(true);
  };

  // Mark individual attendance
  const markAttendance = (studentId: string, status: 'present' | 'absent') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Mark all present
  const markAllPresent = () => {
    if (!students || !Array.isArray(students)) return;
    const newRecords: Record<string, string> = {};
    students.forEach((student: Student) => {
      newRecords[student.id] = 'present';
    });
    setAttendanceRecords(newRecords);
  };

  // Save attendance
  const handleSaveAttendance = () => {
    const attendanceData: AttendanceRecord[] = Object.entries(attendanceRecords).map(
      ([studentId, status]) => ({
        studentId,
        status: status as 'present' | 'absent',
      })
    );

    if (attendanceData.length === 0) {
      toast({
        title: "No Records",
        description: "Please mark attendance before saving",
        variant: "destructive",
      });
      return;
    }

    saveAttendanceMutation.mutate(attendanceData);
  };

  // Filter students based on search
  const filteredStudents = Array.isArray(students) ? students.filter((student: Student) =>
    student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Calculate summary
  const presentCount = Object.values(attendanceRecords).filter(status => status === 'present').length;
  const absentCount = Object.values(attendanceRecords).filter(status => status === 'absent').length;
  const totalCount = Array.isArray(students) ? students.length : 0;

  // Load existing attendance data
  useEffect(() => {
    if (existingAttendance && Array.isArray(existingAttendance) && existingAttendance.length > 0) {
      const records: Record<string, string> = {};
      existingAttendance.forEach((record: any) => {
        records[record.studentId] = record.status;
      });
      setAttendanceRecords(records);
    }
  }, [existingAttendance]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* Selection Panel */}
        <Card className="mb-6" data-testid="card-selection-panel">
          <CardHeader>
            <CardTitle className="flex items-center" data-testid="title-class-selection">
              <Settings className="text-primary mr-2" />
              Class Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="batch" data-testid="label-batch">Batch</Label>
                <Select onValueChange={setSelectedBatch} data-testid="select-batch">
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
              </div>

              <div>
                <Label htmlFor="semester" data-testid="label-semester">Semester</Label>
                <Select onValueChange={setSelectedSemester} disabled={!selectedBatch} data-testid="select-semester">
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
              </div>

              <div>
                <Label htmlFor="subject" data-testid="label-subject">Subject</Label>
                <Select onValueChange={setSelectedSubject} disabled={!selectedSemester} data-testid="select-subject">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(subjects) && subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id} data-testid={`option-subject-${subject.code}`}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date" data-testid="label-date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  data-testid="input-date"
                />
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <Button onClick={handleLoadAttendance} data-testid="button-load-attendance">
                <Search className="mr-2 h-4 w-4" />
                Load Attendance
              </Button>
              <Button 
                onClick={markAllPresent} 
                variant="secondary"
                disabled={!showStudents}
                data-testid="button-mark-all-present"
              >
                <SquareCheck className="mr-2 h-4 w-4" />
                Mark All Present
              </Button>
              <Button 
                onClick={handleSaveAttendance}
                className="bg-accent hover:bg-accent/90"
                disabled={!showStudents}
                data-testid="button-save-attendance"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Attendance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        {showStudents && (
          <Card className="mb-6" data-testid="card-student-list">
            <CardHeader>
              <CardTitle className="flex items-center justify-between" data-testid="title-student-attendance">
                <div className="flex items-center">
                  <Users className="text-primary mr-2" />
                  Student Attendance
                </div>
                <span className="text-sm text-muted-foreground" data-testid="text-attendance-info">
                  {selectedDate} | {Array.isArray(subjects) ? subjects.find((s: any) => s.id === selectedSubject)?.name : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-80"
                  data-testid="input-search-students"
                />
              </div>

              <div className="overflow-x-auto">
                <Table data-testid="table-students">
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="header-roll-no">Roll No.</TableHead>
                      <TableHead data-testid="header-student-name">Student Name</TableHead>
                      <TableHead data-testid="header-email">Email</TableHead>
                      <TableHead className="text-center" data-testid="header-attendance">Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center" data-testid="text-loading">
                          Loading students...
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center" data-testid="text-no-students">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student: Student) => (
                        <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                          <TableCell data-testid={`text-roll-no-${student.id}`}>
                            {student.rollNo}
                          </TableCell>
                          <TableCell data-testid={`text-name-${student.id}`}>
                            {student.user.name}
                          </TableCell>
                          <TableCell data-testid={`text-email-${student.id}`}>
                            {student.user.email}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-2">
                              <Button
                                size="sm"
                                variant={attendanceRecords[student.id] === 'present' ? 'secondary' : 'outline'}
                                onClick={() => markAttendance(student.id, 'present')}
                                data-testid={`button-present-${student.id}`}
                              >
                                <UserCheck className="mr-1 h-3 w-3" />
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={attendanceRecords[student.id] === 'absent' ? 'destructive' : 'outline'}
                                onClick={() => markAttendance(student.id, 'absent')}
                                data-testid={`button-absent-${student.id}`}
                              >
                                <UserX className="mr-1 h-3 w-3" />
                                Absent
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Summary */}
        {showStudents && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="section-attendance-summary">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-secondary/10 rounded-full p-3">
                    <UserCheck className="text-secondary text-xl" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Present</h4>
                    <p className="text-2xl font-bold text-secondary" data-testid="text-present-count">
                      {presentCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-destructive/10 rounded-full p-3">
                    <UserX className="text-destructive text-xl" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Absent</h4>
                    <p className="text-2xl font-bold text-destructive" data-testid="text-absent-count">
                      {absentCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-muted rounded-full p-3">
                    <Users className="text-muted-foreground text-xl" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Total</h4>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-count">
                      {totalCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
