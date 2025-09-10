import { 
  users, students, teachers, batches, semesters, subjects, attendance,
  type User, type InsertUser, type Student, type InsertStudent, 
  type Teacher, type InsertTeacher, type Batch, type InsertBatch,
  type Semester, type InsertSemester, type Subject, type InsertSubject,
  type Attendance, type InsertAttendance
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Students
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByUserId(userId: string): Promise<Student | undefined>;
  getAllStudents(): Promise<(Student & { user: User })[]>;
  getStudentsByBatch(batchId: string): Promise<(Student & { user: User })[]>;
  getStudentsByBatchAndSemester(batchId: string, semesterId: string): Promise<(Student & { user: User })[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Teachers
  getTeacher(id: string): Promise<Teacher | undefined>;
  getTeacherByUserId(userId: string): Promise<Teacher | undefined>;
  getAllTeachers(): Promise<(Teacher & { user: User })[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  
  // Batches
  getAllBatches(): Promise<Batch[]>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  
  // Semesters
  getAllSemesters(): Promise<Semester[]>;
  createSemester(semester: InsertSemester): Promise<Semester>;
  
  // Subjects
  getAllSubjects(): Promise<Subject[]>;
  getSubjectsBySemester(semesterId: string): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  // Attendance
  getAttendanceByDateAndSubject(date: string, subjectId: string): Promise<(Attendance & { student: Student & { user: User } })[]>;
  getStudentAttendance(studentId: string, subjectId?: string, fromDate?: string, toDate?: string): Promise<(Attendance & { subject: Subject, teacher: Teacher & { user: User } })[]>;
  getStudentAttendanceRangeReport(studentId: string, subjectId?: string, fromDate?: string, toDate?: string): Promise<any>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, status: string): Promise<Attendance>;
  createBulkAttendance(attendanceRecords: InsertAttendance[]): Promise<Attendance[]>;
  
  // Reports
  getAttendanceReport(date: string, subjectId: string, batchId: string, semesterId?: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByUserId(userId: string): Promise<Student | undefined> {
    const result = await db
      .select()
      .from(students)
      .leftJoin(batches, eq(students.batchId, batches.id))
      .leftJoin(semesters, eq(students.semesterId, semesters.id))
      .where(eq(students.userId, userId));
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row.students,
      batch: row.batches,
      semester: row.semesters
    } as any;
  }

  async getAllStudents(): Promise<(Student & { user: User })[]> {
    const result = await db
      .select()
      .from(students)
      .innerJoin(users, eq(students.userId, users.id));
    
    return result.map((r: any) => ({ ...r.students, user: r.users }));
  }

  async getStudentsByBatch(batchId: string): Promise<(Student & { user: User })[]> {
    const result = await db
      .select()
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(students.batchId, batchId));
    
    return result.map((r: any) => ({ ...r.students, user: r.users }));
  }

  async getStudentsByBatchAndSemester(batchId: string, semesterId: string): Promise<(Student & { user: User })[]> {
    const result = await db
      .select()
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(and(eq(students.batchId, batchId), eq(students.semesterId, semesterId)));
    
    return result.map((r: any) => ({ ...r.students, user: r.users }));
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async getAllTeachers(): Promise<(Teacher & { user: User })[]> {
    const result = await db
      .select()
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id));
    
    return result.map((r: any) => ({ ...r.teachers, user: r.users }));
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher || undefined;
  }

  async getTeacherByUserId(userId: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, userId));
    return teacher || undefined;
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db.insert(teachers).values(insertTeacher).returning();
    return teacher;
  }

  async getAllBatches(): Promise<Batch[]> {
    return await db.select().from(batches);
  }

  async createBatch(insertBatch: InsertBatch): Promise<Batch> {
    const [batch] = await db.insert(batches).values(insertBatch).returning();
    return batch;
  }

  async getAllSemesters(): Promise<Semester[]> {
    return await db.select().from(semesters);
  }

  async createSemester(insertSemester: InsertSemester): Promise<Semester> {
    const [semester] = await db.insert(semesters).values(insertSemester).returning();
    return semester;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubjectsBySemester(semesterId: string): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.semesterId, semesterId));
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(insertSubject).returning();
    return subject;
  }

  async getAttendanceByDateAndSubject(date: string, subjectId: string): Promise<(Attendance & { student: Student & { user: User } })[]> {
    const result = await db
      .select()
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .innerJoin(users, eq(students.userId, users.id))
      .where(and(eq(attendance.date, date), eq(attendance.subjectId, subjectId)));
    
    return result.map((r: any) => ({ ...r.attendance, student: { ...r.students, user: r.users } }));
  }

  async getStudentAttendance(studentId: string, subjectId?: string, fromDate?: string, toDate?: string): Promise<(Attendance & { subject: Subject, teacher: Teacher & { user: User } })[]> {
    // Build where conditions
    const conditions = [eq(attendance.studentId, studentId)];
    if (subjectId) {
      conditions.push(eq(attendance.subjectId, subjectId));
    }
    
    // Add date filtering
    if (fromDate) {
      conditions.push(gte(attendance.date, fromDate));
    }
    if (toDate) {
      conditions.push(lte(attendance.date, toDate));
    }

    const result = await db
      .select()
      .from(attendance)
      .innerJoin(subjects, eq(attendance.subjectId, subjects.id))
      .innerJoin(teachers, eq(attendance.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(attendance.date));

    return result.map((r: any) => ({ 
      ...r.attendance, 
      subject: r.subjects, 
      teacher: { ...r.teachers, user: r.users } 
    }));
  }

  async getStudentAttendanceRangeReport(studentId: string, subjectId?: string, fromDate?: string, toDate?: string): Promise<any> {
    if (!fromDate || !toDate) {
      throw new Error('fromDate and toDate are required');
    }

    // Build where conditions
    const conditions = [eq(attendance.studentId, studentId)];
    if (subjectId) {
      conditions.push(eq(attendance.subjectId, subjectId));
    }
    
    // Add date filtering
    conditions.push(gte(attendance.date, fromDate));
    conditions.push(lte(attendance.date, toDate));

    const result = await db
      .select()
      .from(attendance)
      .innerJoin(subjects, eq(attendance.subjectId, subjects.id))
      .innerJoin(teachers, eq(attendance.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(and(...conditions))
      .orderBy(attendance.date);

    // Generate date range
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    const dates: string[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    // Create attendance map by date
    const attendanceMap: Record<string, string> = {};
    result.forEach((record: any) => {
      const dateKey = record.attendance.date.split('T')[0];
      attendanceMap[dateKey] = record.attendance.status;
    });

    // Calculate statistics
    let present = 0;
    let total = 0;
    const statusByDate: Record<string, string> = {};
    
    for (const date of dates) {
      const status = attendanceMap[date] || 'not_marked';
      statusByDate[date] = status;
      if (status === 'present') present++;
      if (status === 'present' || status === 'absent') total++;
    }

    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      dates,
      statusByDate,
      present,
      total,
      percent,
      subjectName: result.length > 0 ? result[0].subjects.name : null
    };
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [attendanceRecord] = await db.insert(attendance).values(insertAttendance).returning();
    return attendanceRecord;
  }

  async updateAttendance(id: string, status: string): Promise<Attendance> {
    const [attendanceRecord] = await db
      .update(attendance)
      .set({ status })
      .where(eq(attendance.id, id))
      .returning();
    return attendanceRecord;
  }

  async createBulkAttendance(attendanceRecords: InsertAttendance[]): Promise<Attendance[]> {
    const result = await db.insert(attendance).values(attendanceRecords).returning();
    return result;
  }

  async getAttendanceReport(date: string, subjectId: string, batchId: string, semesterId?: string): Promise<any> {
    // Get all students in the batch (and semester if provided)
    let batchStudents;
    if (semesterId) {
      batchStudents = await this.getStudentsByBatchAndSemester(batchId, semesterId);
    } else {
      batchStudents = await this.getStudentsByBatch(batchId);
    }

    // Get attendance records for the specific date and subject
    const attendanceRecords = await this.getAttendanceByDateAndSubject(date, subjectId);

    // Create a map of student attendance
    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
      attendanceMap.set(record.student.id, record.status);
    });

    // Use local counters
    let presentCount = 0;
    let absentCount = 0;
    let notMarkedCount = 0;

    const students = batchStudents.map(student => {
      const status = attendanceMap.get(student.id) || 'not_marked';
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else notMarkedCount++;

      return {
        id: student.id,
        rollNo: student.rollNo,
        name: student.user.name,
        email: student.user.email,
        status: status
      };
    });

    const report = {
      date,
      subjectId,
      batchId,
      semesterId,
      totalStudents: batchStudents.length,
      presentCount,
      absentCount,
      notMarkedCount,
      students
    };

    return report;
  }

  async getAttendanceRangeReport(batchId: string, semesterId: string, subjectId: string, startDate: string, endDate: string) {
    // Get all students in the batch and semester
    const students = await this.getStudentsByBatchAndSemester(batchId, semesterId);

    // Build date range array
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10)); // yyyy-mm-dd
    }

    // Get all attendance records for these students, subject, and date range
    const studentIds = students.map(s => s.id);
    const allAttendance = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.subjectId, subjectId),
          inArray(attendance.studentId, studentIds)
        )
      );

    // Map: { studentId: { date: status } }
    const attendanceMap: Record<string, Record<string, string>> = {};
    for (const record of allAttendance) {
      if (!attendanceMap[record.studentId]) attendanceMap[record.studentId] = {};
      // Only use date part (yyyy-mm-dd)
      const dateKey = new Date(record.date).toISOString().slice(0, 10);
      // Only include if dateKey is in the range
      if (dates.includes(dateKey)) {
        attendanceMap[record.studentId][dateKey] = record.status;
      }
    }

    // Build report rows
    const rows = students.map(student => {
      let present = 0;
      let total = 0;
      const statusByDate: Record<string, string> = {};
      for (const date of dates) {
        const status = attendanceMap[student.id]?.[date] || 'not_marked';
        statusByDate[date] = status;
        if (status === 'present') present++;
        if (status === 'present' || status === 'absent') total++;
      }
      const percent = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        id: student.id,
        rollNo: student.rollNo,
        name: student.user.name,
        email: student.user.email,
        statusByDate,
        percent
      };
    });

    return {
      dates,
      students: rows
    };
  }
}

export const storage = new DatabaseStorage();
