import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Filter, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/navbar";

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent';
  subject: {
    name: string;
    code: string;
  };
  teacher: {
    user: {
      name: string;
    };
  };
}

export default function StudentDashboard() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const user = getCurrentUser();
  const student = user?.student;

  // Fetch student's attendance records
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['/api/student-attendance', student?.id, selectedSubject, fromDate, toDate],
    enabled: !!student?.id,
  });

  // Fetch subjects for filtering
  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects', student?.semesterId],
    enabled: !!student?.semesterId,
  });

  // Calculate attendance statistics
  const calculateAttendanceStats = () => {
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) return {};

    const subjectStats: Record<string, { present: number; total: number; percentage: number }> = {};

    attendanceRecords.forEach((record: AttendanceRecord) => {
      const subjectName = record.subject.name;
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = { present: 0, total: 0, percentage: 0 };
      }
      
      subjectStats[subjectName].total++;
      if (record.status === 'present') {
        subjectStats[subjectName].present++;
      }
    });

    // Calculate percentages
    Object.keys(subjectStats).forEach(subject => {
      const stats = subjectStats[subject];
      stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
    });

    // Calculate overall percentage
    const totalRecords = Array.isArray(attendanceRecords) ? attendanceRecords.length : 0;
    const totalPresent = Array.isArray(attendanceRecords) ? attendanceRecords.filter((r: AttendanceRecord) => r.status === 'present').length : 0;
    const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    return { subjectStats, overallPercentage };
  };

  const { subjectStats = {}, overallPercentage = 0 } = calculateAttendanceStats();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* Student Info Card */}
        <Card className="mb-6" data-testid="card-student-info">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 rounded-full p-4">
                <GraduationCap className="text-primary text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground" data-testid="text-student-name">
                  {user?.name}
                </h2>
                <p className="text-muted-foreground" data-testid="text-roll-no">
                  Roll No: {student?.rollNo}
                </p>
                <p className="text-muted-foreground" data-testid="text-batch-semester">
                  {student?.batch?.name} | Semester {student?.semester?.number}
                </p>
              </div>
              <div className="ml-auto">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Overall Attendance</p>
                  <p className="text-2xl font-bold text-secondary" data-testid="text-overall-percentage">
                    {overallPercentage}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Filter */}
        <Card className="mb-6" data-testid="card-filter">
          <CardHeader>
            <CardTitle className="flex items-center" data-testid="title-filter-attendance">
              <Filter className="text-primary mr-2" />
              Filter Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subject-filter" data-testid="label-subject-filter">Subject</Label>
                <Select onValueChange={setSelectedSubject} data-testid="select-subject-filter">
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" data-testid="option-all-subjects">All Subjects</SelectItem>
                    {Array.isArray(subjects) && subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id} data-testid={`option-subject-${subject.code}`}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="from-date" data-testid="label-from-date">From Date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  data-testid="input-from-date"
                />
              </div>

              <div>
                <Label htmlFor="to-date" data-testid="label-to-date">To Date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  data-testid="input-to-date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card className="mb-6" data-testid="card-attendance-records">
          <CardHeader>
            <CardTitle className="flex items-center justify-between" data-testid="title-attendance-records">
              <div className="flex items-center">
                <CalendarCheck className="text-primary mr-2" />
                Attendance Records
              </div>
              <span className="text-sm text-muted-foreground" data-testid="text-records-info">
                {Array.isArray(attendanceRecords) ? attendanceRecords.length : 0} records
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table data-testid="table-attendance">
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="header-date">Date</TableHead>
                    <TableHead data-testid="header-subject">Subject</TableHead>
                    <TableHead data-testid="header-teacher">Teacher</TableHead>
                    <TableHead className="text-center" data-testid="header-status">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center" data-testid="text-loading">
                        Loading attendance records...
                      </TableCell>
                    </TableRow>
                  ) : !attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center" data-testid="text-no-records">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(attendanceRecords) && attendanceRecords.map((record: AttendanceRecord) => (
                      <TableRow key={record.id} data-testid={`row-attendance-${record.id}`}>
                        <TableCell data-testid={`text-date-${record.id}`}>
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell data-testid={`text-subject-${record.id}`}>
                          {record.subject.name}
                        </TableCell>
                        <TableCell data-testid={`text-teacher-${record.id}`}>
                          {record.teacher.user.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={record.status === 'present' ? 'secondary' : 'destructive'}
                            className="inline-flex items-center"
                            data-testid={`badge-status-${record.id}`}
                          >
                            <span 
                              className={`attendance-status ${
                                record.status === 'present' ? 'status-present' : 'status-absent'
                              }`}
                            />
                            {record.status === 'present' ? 'Present' : 'Absent'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Subject-wise Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="section-subject-summary">
          {Object.entries(subjectStats).map(([subjectName, stats]) => (
            <Card key={subjectName} data-testid={`card-subject-${subjectName}`}>
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2" data-testid={`text-subject-name-${subjectName}`}>
                  {subjectName}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-foreground" data-testid={`text-percentage-${subjectName}`}>
                    {stats.percentage}%
                  </span>
                  <span className="text-xs text-muted-foreground" data-testid={`text-ratio-${subjectName}`}>
                    {stats.present}/{stats.total}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      stats.percentage >= 85 ? 'bg-secondary' : 
                      stats.percentage >= 75 ? 'bg-accent' : 'bg-destructive'
                    }`}
                    style={{ width: `${stats.percentage}%` }}
                    data-testid={`progress-bar-${subjectName}`}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
