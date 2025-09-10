import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'teacher' or 'student'
  name: text("name").notNull(),
  createdAt: integer("createdAt").$defaultFn(() => Date.now()),
});

export const batches = sqliteTable("batches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  year: integer("year").notNull().unique(),
  name: text("name").notNull(),
});

export const semesters = sqliteTable("semesters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  number: integer("number").notNull(),
  name: text("name").notNull(),
});

export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  semesterId: text("semesterId").references(() => semesters.id),
});

export const students = sqliteTable("students", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id),
  rollNo: text("rollNo").notNull().unique(),
  batchId: text("batchId").references(() => batches.id),
  semesterId: text("semesterId").references(() => semesters.id),
});

export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id),
  employeeId: text("employeeId").notNull().unique(),
});

export const attendance = sqliteTable("attendance", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("studentId").references(() => students.id),
  subjectId: text("subjectId").references(() => subjects.id),
  teacherId: text("teacherId").references(() => teachers.id),
  date: text("date").notNull(), // Store as ISO string
  status: text("status").notNull(), // 'present' or 'absent'
  createdAt: text("createdAt").$defaultFn(() => new Date().toISOString()),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  teacher: one(teachers, {
    fields: [users.id],
    references: [teachers.userId],
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  batch: one(batches, {
    fields: [students.batchId],
    references: [batches.id],
  }),
  semester: one(semesters, {
    fields: [students.semesterId],
    references: [semesters.id],
  }),
  attendance: many(attendance),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  attendance: many(attendance),
}));

export const batchesRelations = relations(batches, ({ many }) => ({
  students: many(students),
}));

export const semestersRelations = relations(semesters, ({ many }) => ({
  students: many(students),
  subjects: many(subjects),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  semester: one(semesters, {
    fields: [subjects.semesterId],
    references: [semesters.id],
  }),
  attendance: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  subject: one(subjects, {
    fields: [attendance.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [attendance.teacherId],
    references: [teachers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
});

export const insertSemesterSchema = createInsertSchema(semesters).omit({
  id: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
});

export const insertAttendanceSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  date: z.string(),
  status: z.enum(['present', 'absent'])
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['teacher', 'student']),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['teacher', 'student']),
  rollNo: z.string().optional(),
  employeeId: z.string().optional(),
  batchId: z.string().optional(),
  semesterId: z.string().optional(),
}).refine((data) => {
  if (data.role === 'student') {
    return data.rollNo && data.batchId && data.semesterId;
  }
  if (data.role === 'teacher') {
    return data.employeeId;
  }
  return true;
}, {
  message: "Student must provide roll number, batch, and semester. Teacher must provide employee ID.",
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Semester = typeof semesters.$inferSelect;
export type InsertSemester = z.infer<typeof insertSemesterSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type SignupRequest = z.infer<typeof signupSchema>;
