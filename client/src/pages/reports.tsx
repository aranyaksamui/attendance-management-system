import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { addDays, eachDayOfInterval } from 'date-fns';
import { Link } from 'wouter';

interface Batch {
  id: string;
  year: number;
  name: string;
}

interface Semester {
  id: string;
  number: number;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface AttendanceReport {
  date: string;
  subjectId: string;
  batchId: string;
  semesterId?: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  notMarkedCount: number;
  students: Array<{
    id: string;
    rollNo: string;
    name: string;
    email: string;
    status: string;
  }>;
}

export default function ReportsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);
  const [rangeReport, setRangeReport] = useState<any>(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState('');

  useEffect(() => {
    fetchBatches();
    fetchSemesters();
    fetchSubjects();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/semesters');
      if (response.ok) {
        const data = await response.json();
        setSemesters(data);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedDate || !selectedBatch || !selectedSubject || !selectedSemester) {
      setError('Please select date, batch, semester, and subject');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(
        `/api/reports/attendance?date=${dateString}&subjectId=${selectedSubject}&batchId=${selectedBatch}&semesterId=${selectedSemester}`
      );

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate report');
      }
    } catch (error) {
      setError('Error generating report');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRangeReport = async () => {
    if (!rangeStart || !rangeEnd || !selectedBatch || !selectedSemester || !selectedSubject) {
      setRangeError('Please select batch, semester, subject, and date range');
      return;
    }
    setRangeLoading(true);
    setRangeError('');
    setRangeReport(null);
    try {
      const startString = format(rangeStart, 'yyyy-MM-dd');
      const endString = format(rangeEnd, 'yyyy-MM-dd');
      const response = await fetch(
        `/api/reports/attendance-range?batchId=${selectedBatch}&semesterId=${selectedSemester}&subjectId=${selectedSubject}&startDate=${startString}&endDate=${endString}`
      );
      if (response.ok) {
        const data = await response.json();
        setRangeReport(data);
      } else {
        const errorData = await response.json();
        setRangeError(errorData.message || 'Failed to generate range report');
      }
    } catch (error) {
      setRangeError('Error generating range report');
    } finally {
      setRangeLoading(false);
    }
  };

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

  const getAttendancePercentage = () => {
    if (!report || report.totalStudents === 0) return 0;
    return Math.round((report.presentCount / report.totalStudents) * 100);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Attendance Reports</h1>
        <Link href="/teacher-dashboard">
          <Button variant="outline">Back to Teacher Dashboard</Button>
        </Link>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Batch Selector */}
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semester Selector */}
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.name} (Sem {semester.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selector */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <Button 
            onClick={generateReport} 
            disabled={loading || !selectedDate || !selectedBatch || !selectedSemester || !selectedSubject}
            className="w-full md:w-auto"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {/* Report Results - ALWAYS SHOWS BEFORE RANGE FORM */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Report</CardTitle>
            <div className="text-sm text-muted-foreground">
              {format(new Date(report.date), 'EEEE, MMMM do, yyyy')} • {subjects.find(s => s.id === report.subjectId)?.name} • {batches.find(b => b.id === report.batchId)?.name} • {semesters.find(s => s.id === report.semesterId)?.name}
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{report.totalStudents}</div>
                <div className="text-sm text-blue-600">Total Students</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{report.presentCount}</div>
                <div className="text-sm text-green-600">Present</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{report.absentCount}</div>
                <div className="text-sm text-red-600">Absent</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{getAttendancePercentage()}%</div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
              </div>
            </div>

            {/* Student List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Student Details</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.rollNo}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{getStatusBadge(student.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Range Report Filters - ALWAYS SHOWS BELOW SINGLE DAY REPORT */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Range Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Start Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="rangeStart">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !rangeStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {rangeStart ? format(rangeStart, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={rangeStart}
                    onSelect={setRangeStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* End Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="rangeEnd">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !rangeEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {rangeEnd ? format(rangeEnd, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={rangeEnd}
                    onSelect={setRangeEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* Batch, Semester, Subject selectors (reuse existing) */}
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.name} (Sem {semester.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {rangeError && <div className="text-red-600 text-sm">{rangeError}</div>}
          <Button
            onClick={generateRangeReport}
            disabled={rangeLoading || !rangeStart || !rangeEnd || !selectedBatch || !selectedSemester || !selectedSubject}
            className="w-full md:w-auto"
          >
            {rangeLoading ? 'Generating...' : 'Generate Range Report'}
          </Button>
        </CardContent>
      </Card>

      {/* Range Report Table - ALWAYS SHOWS BELOW RANGE FORM */}
      {rangeReport && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Range Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 bg-white">Roll No</TableHead>
                    <TableHead className="sticky left-[80px] z-10 bg-white">Name</TableHead>
                    {rangeReport.dates.map((date: string, idx: number) => (
                      <TableHead key={date}>{date}</TableHead>
                    ))}
                    <TableHead>% Present</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rangeReport.students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="sticky left-0 bg-white font-medium border-r">{student.rollNo}</TableCell>
                      <TableCell className="sticky left-[80px] bg-white border-r">{student.name}</TableCell>
                      {rangeReport.dates.map((date: string) => (
                        <TableCell key={date}>{getStatusBadge(student.statusByDate[date])}</TableCell>
                      ))}
                      <TableCell>{student.percent}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
