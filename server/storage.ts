import { 
  users, students, teachers, batches, semesters, subjects, attendance,
  type User, type InsertUser, type Student, type InsertStudent, 
  type Teacher, type InsertTeacher, type Batch, type InsertBatch,
  type Semester, type InsertSemester, type Subject, type InsertSubject,
  type Attendance, type InsertAttendance
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Students
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByUserId(userId: string): Promise<Student | undefined>;
  getStudentsByBatchAndSemester(batchId: string, semesterId: string): Promise<(Student & { user: User })[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Teachers
  getTeacher(id: string): Promise<Teacher | undefined>;
  getTeacherByUserId(userId: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  
  // Batches
  getAllBatches(): Promise<Batch[]>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  
  // Semesters
  getAllSemesters(): Promise<Semester[]>;
  createSemester(semester: InsertSemester): Promise<Semester>;
  
  // Subjects
  getSubjectsBySemester(semesterId: string): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  // Attendance
  getAttendanceByDateAndSubject(date: string, subjectId: string): Promise<(Attendance & { student: Student & { user: User } })[]>;
  getStudentAttendance(studentId: string, subjectId?: string, fromDate?: string, toDate?: string): Promise<(Attendance & { subject: Subject, teacher: Teacher & { user: User } })[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, status: string): Promise<Attendance>;
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
    const [student] = await db.select().from(students).where(eq(students.userId, userId));
    return student || undefined;
  }

  async getStudentsByBatchAndSemester(batchId: string, semesterId: string): Promise<(Student & { user: User })[]> {
    const result = await db
      .select()
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(and(eq(students.batchId, batchId), eq(students.semesterId, semesterId)));
    
    return result.map(r => ({ ...r.students, user: r.users }));
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
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
    
    return result.map(r => ({ ...r.attendance, student: { ...r.students, user: r.users } }));
  }

  async getStudentAttendance(studentId: string, subjectId?: string, fromDate?: string, toDate?: string): Promise<(Attendance & { subject: Subject, teacher: Teacher & { user: User } })[]> {
    // Build where conditions
    const conditions = [eq(attendance.studentId, studentId)];
    if (subjectId) {
      conditions.push(eq(attendance.subjectId, subjectId));
    }

    const result = await db
      .select()
      .from(attendance)
      .innerJoin(subjects, eq(attendance.subjectId, subjects.id))
      .innerJoin(teachers, eq(attendance.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(attendance.date));

    return result.map(r => ({ 
      ...r.attendance, 
      subject: r.subjects, 
      teacher: { ...r.teachers, user: r.users } 
    }));
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
}

export const storage = new DatabaseStorage();
