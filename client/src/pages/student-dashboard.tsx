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

  // Fetch student's attendance: all subjects by default, or selected subject if chosen
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['/api/student-attendance', student?.id, selectedSubject],
    enabled: !!student?.id,
    queryFn: async () => {
      if (!student?.id) return [];
      const params = new URLSearchParams();
      if (selectedSubject && selectedSubject !== 'all') params.append('subjectId', selectedSubject);
      const url = `/api/student-attendance/${student.id}${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch attendance');
      return res.json();
    },
  });

  // Fetch subjects for filtering
  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects', student?.semesterId],
    enabled: !!student?.semesterId,
  });

  // Fetch student's attendance range report
  const { data: rangeReport, isLoading: rangeLoading } = useQuery({
    queryKey: ['/api/student-attendance-range', student?.id, selectedSubject, fromDate, toDate],
    enabled: !!student?.id && !!fromDate && !!toDate && !!selectedSubject && selectedSubject !== 'all',
    queryFn: async () => {
      if (!student?.id || !fromDate || !toDate || !selectedSubject || selectedSubject === 'all') return null;
      const params = new URLSearchParams();
      params.append('subjectId', selectedSubject);
      params.append('fromDate', fromDate);
      params.append('toDate', toDate);
      const url = `/api/student-attendance-range/${student.id}?${params.toString()}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch range report');
      return res.json();
    },
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

  // Helper function for status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>;
      case 'not_marked':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Not Marked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
              {selectedSubject && selectedSubject !== 'all' && (
                <div className="ml-auto">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Overall for Selected Subject</p>
                    <p className="text-2xl font-bold text-secondary" data-testid="text-overall-percentage">
                      {overallPercentage}%
                    </p>
                  </div>
                </div>
              )}
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
                    <SelectItem value="all" data-testid="option-all-subjects">All Subjects</SelectItem>
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

        {/* Range Report Section */}
        {selectedSubject && selectedSubject !== 'all' && fromDate && toDate && (
          <Card className="mb-6" data-testid="card-range-report">
            <CardHeader>
              <CardTitle className="flex items-center justify-between" data-testid="title-range-report">
                <div className="flex items-center">
                  <CalendarCheck className="text-primary mr-2" />
                  Range Report {selectedSubject && selectedSubject !== 'all' ? `- ${Array.isArray(subjects) ? subjects.find((s: any) => s.id === selectedSubject)?.name || 'Selected Subject' : 'Selected Subject'}` : '- All Subjects'}
                </div>
                {rangeReport && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Range Attendance</div>
                    <div className="text-lg font-bold text-primary">{rangeReport.percent}%</div>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Percentage card under range header */}
              {rangeReport && (
                <div className="mb-4 bg-orange-50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Range Attendance</p>
                    <p className="text-2xl font-bold text-orange-600">{rangeReport.percent}%</p>
                  </div>
                  <div className="text-right text-muted-foreground">
                    {(() => {
                      const total = Array.isArray(rangeReport.dates) ? rangeReport.dates.filter((d: string) => ['present','absent'].includes(rangeReport.statusByDate[d])).length : 0;
                      const present = Array.isArray(rangeReport.dates) ? rangeReport.dates.filter((d: string) => rangeReport.statusByDate[d] === 'present').length : 0;
                      return `${present}/${total}`;
                    })()}
                  </div>
                </div>
              )}
              {rangeLoading ? (
                <div className="text-center py-8" data-testid="text-range-loading">
                  Loading range report...
                </div>
              ) : rangeReport ? (
                <div className="overflow-x-auto">
                  <Table data-testid="table-range-report">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 z-10 bg-white">Date</TableHead>
                        {rangeReport.dates.map((date: string) => (
                          <TableHead key={date}>
                            {(() => {
                              const d = new Date(date);
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              return `${day}-${month}`;
                            })()}
                          </TableHead>
                        ))}
                        <TableHead>% Present</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-white font-medium border-r">
                          {user?.name}
                        </TableCell>
                        {rangeReport.dates.map((date: string) => (
                          <TableCell key={date}>
                            {getStatusBadge(rangeReport.statusByDate[date])}
                          </TableCell>
                        ))}
                        <TableCell className="font-medium">{rangeReport.percent}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-range-data">
                  No attendance data found for the selected date range
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Total Attendance for Selected Subject */}
        {selectedSubject && selectedSubject !== 'all' && (
        <Card className="mb-6" data-testid="card-attendance-records">
          <CardHeader>
            {/* Percentage card for selected subject/all before table */}
            <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="col-span-1 md:col-span-3 bg-orange-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubject && selectedSubject !== 'all'
                      ? `Total Attendance for ${Array.isArray(subjects) ? subjects.find((s: any) => s.id === selectedSubject)?.name || 'Selected Subject' : 'Selected Subject'}`
                      : 'All Attendance'}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(() => {
                      const records = Array.isArray(attendanceRecords) ? attendanceRecords : [];
                      const total = records.length;
                      const present = records.filter((r: AttendanceRecord) => r.status === 'present').length;
                      return total > 0 ? Math.round((present / total) * 100) : 0;
                    })()}%
                  </p>
                </div>
                <div className="text-right text-muted-foreground">
                  {(() => {
                    const records = Array.isArray(attendanceRecords) ? attendanceRecords : [];
                    const total = records.length;
                    const present = records.filter((r: AttendanceRecord) => r.status === 'present').length;
                    return `${present}/${total}`;
                  })()}
                </div>
              </div>
            </div>
            <CardTitle className="flex items-center justify-between" data-testid="title-attendance-records">
              <div className="flex items-center">
                <CalendarCheck className="text-primary mr-2" />
                {selectedSubject && selectedSubject !== 'all' 
                  ? `Total Attendance for ${Array.isArray(subjects) ? subjects.find((s: any) => s.id === selectedSubject)?.name || 'Selected Subject' : 'Selected Subject'}`
                  : 'All Attendance'
                }
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
                          {(() => {
                            const d = new Date(record.date);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            return `${day}-${month}-${year}`;
                          })()}
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
        )}

        {/* All Attendance when no subject selected */}
        {(!selectedSubject || selectedSubject === 'all') && (
        <Card className="mb-6" data-testid="card-attendance-all">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarCheck className="text-primary mr-2" />
                All Attendance
              </div>
              <span className="text-sm text-muted-foreground">
                {Array.isArray(attendanceRecords) ? attendanceRecords.length : 0} records
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Loading attendance records...</TableCell>
                    </TableRow>
                  ) : !attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">No attendance records found</TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(attendanceRecords) && attendanceRecords.map((record: AttendanceRecord) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {(() => {
                            const d = new Date(record.date);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            return `${day}-${month}-${year}`;
                          })()}
                        </TableCell>
                        <TableCell>{record.subject.name}</TableCell>
                        <TableCell>{record.teacher.user.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={record.status === 'present' ? 'secondary' : 'destructive'} className="inline-flex items-center">
                            <span className={`attendance-status ${record.status === 'present' ? 'status-present' : 'status-absent'}`} />
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
        )}

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
