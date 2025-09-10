import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, signupSchema, insertAttendanceSchema, insertSubjectSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { importFromGitHub } from "./import-util";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize seed data
  app.post("/api/seed", async (req, res) => {
    try {
      // Create batches
      const batches = await Promise.all([
        storage.createBatch({ year: 2021, name: "Batch 2021" }),
        storage.createBatch({ year: 2022, name: "Batch 2022" }),
        storage.createBatch({ year: 2023, name: "Batch 2023" }),
        storage.createBatch({ year: 2024, name: "Batch 2024" }),
      ]).catch(() => []); // Ignore if already exist

      // Create semesters
      const semesters = await Promise.all([
        storage.createSemester({ number: 1, name: "Semester 1" }),
        storage.createSemester({ number: 2, name: "Semester 2" }),
        storage.createSemester({ number: 3, name: "Semester 3" }),
        storage.createSemester({ number: 4, name: "Semester 4" }),
        storage.createSemester({ number: 5, name: "Semester 5" }),
        storage.createSemester({ number: 6, name: "Semester 6" }),
        storage.createSemester({ number: 7, name: "Semester 7" }),
        storage.createSemester({ number: 8, name: "Semester 8" }),
      ]).catch(() => []); // Ignore if already exist

      // Create subjects for different semesters
      if (semesters.length > 0) {
        await Promise.all([
          // Semester 1
          storage.createSubject({ name: "Mathematics I", code: "MATH101", semesterId: semesters[0]?.id }),
          storage.createSubject({ name: "Physics I", code: "PHY101", semesterId: semesters[0]?.id }),
          storage.createSubject({ name: "Programming Fundamentals", code: "CS101", semesterId: semesters[0]?.id }),
          // Semester 2
          storage.createSubject({ name: "Mathematics II", code: "MATH102", semesterId: semesters[1]?.id }),
          storage.createSubject({ name: "Data Structures", code: "CS201", semesterId: semesters[1]?.id }),
          storage.createSubject({ name: "Object Oriented Programming", code: "CS202", semesterId: semesters[1]?.id }),
          // Semester 3
          storage.createSubject({ name: "Database Systems", code: "CS301", semesterId: semesters[2]?.id }),
          storage.createSubject({ name: "Web Development", code: "CS302", semesterId: semesters[2]?.id }),
          storage.createSubject({ name: "Computer Networks", code: "CS303", semesterId: semesters[2]?.id }),
          // Semester 4
          storage.createSubject({ name: "Software Engineering", code: "CS401", semesterId: semesters[3]?.id }),
          storage.createSubject({ name: "Operating Systems", code: "CS402", semesterId: semesters[3]?.id }),
          storage.createSubject({ name: "Algorithms", code: "CS403", semesterId: semesters[3]?.id }),
          // Semester 5
          storage.createSubject({ name: "Machine Learning", code: "CS501", semesterId: semesters[4]?.id }),
          storage.createSubject({ name: "Artificial Intelligence", code: "CS502", semesterId: semesters[4]?.id }),
          storage.createSubject({ name: "Mobile App Development", code: "CS503", semesterId: semesters[4]?.id }),
          // Semester 6
          storage.createSubject({ name: "Cloud Computing", code: "CS601", semesterId: semesters[5]?.id }),
          storage.createSubject({ name: "Cybersecurity", code: "CS602", semesterId: semesters[5]?.id }),
          storage.createSubject({ name: "DevOps", code: "CS603", semesterId: semesters[5]?.id }),
        ]).catch(() => []); // Ignore if already exist
      }

      res.json({ message: "Seed data initialized successfully" });
    } catch (error) {
      res.json({ message: "Seed data may already exist" });
    }
  });

  // Signup
  app.post("/api/signup", async (req, res) => {
    try {
      const signupData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(signupData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(signupData.password, 10);

      // Create user
      const user = await storage.createUser({
        email: signupData.email,
        password: hashedPassword,
        role: signupData.role,
        name: signupData.name,
      });

      // Create role-specific record
      if (signupData.role === 'student') {
        await storage.createStudent({
          userId: user.id,
          rollNo: signupData.rollNo!,
          batchId: signupData.batchId!,
          semesterId: signupData.semesterId!,
        });
      } else if (signupData.role === 'teacher') {
        await storage.createTeacher({
          userId: user.id,
          employeeId: signupData.employeeId!,
        });
      }

      res.json({ 
        message: "Account created successfully",
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Failed to create account" });
    }
  });

  // Authentication
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password, role } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== role) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Get additional user info based on role
      let student = null;
      let teacher = null;
      
      if (role === 'student') {
        student = await storage.getStudentByUserId(user.id);
      } else if (role === 'teacher') {
        teacher = await storage.getTeacherByUserId(user.id);
      }

      res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        student,
        teacher
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get batches
  app.get("/api/batches", async (req, res) => {
    try {
      const batches = await storage.getAllBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch batches" });
    }
  });

  // Get semesters
  app.get("/api/semesters", async (req, res) => {
    try {
      const semesters = await storage.getAllSemesters();
      res.json(semesters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch semesters" });
    }
  });

  // Get all subjects
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Get subjects by semester
  app.get("/api/subjects/:semesterId", async (req, res) => {
    try {
      const { semesterId } = req.params;
      const subjects = await storage.getSubjectsBySemester(semesterId);
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Create subject
  app.post("/api/subjects", async (req, res) => {
    try {
      const subjectData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(subjectData);
      res.json(subject);
    } catch (error) {
      res.status(400).json({ message: "Failed to create subject" });
    }
  });

  // Get all teachers
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  // Get all students
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Get students by batch
  app.get("/api/students/batch/:batchId", async (req, res) => {
    try {
      const { batchId } = req.params;
      const students = await storage.getStudentsByBatch(batchId);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students by batch" });
    }
  });

  // Get attendance report
  app.get("/api/reports/attendance", async (req, res) => {
    try {
      const { date, subjectId, batchId, semesterId } = req.query;
      
      if (!date || !subjectId || !batchId) {
        return res.status(400).json({ 
          message: "Date, subjectId, and batchId are required" 
        });
      }

      const report = await storage.getAttendanceReport(date as string, subjectId as string, batchId as string, semesterId as string | undefined);
      res.json(report);
    } catch (error) {
      console.error('Error generating attendance report:', error);
      res.status(500).json({ message: "Failed to generate attendance report" });
    }
  });

  // Attendance range report for students
  app.get("/api/reports/attendance-range", async (req, res) => {
    try {
      const { batchId, semesterId, subjectId, startDate, endDate } = req.query;
      if (!batchId || !semesterId || !subjectId || !startDate || !endDate) {
        return res.status(400).json({ message: "batchId, semesterId, subjectId, startDate, and endDate are required" });
      }
      const report = await storage.getAttendanceRangeReport(
        batchId as string,
        semesterId as string,
        subjectId as string,
        startDate as string,
        endDate as string
      );
      res.json(report);
    } catch (error) {
      console.error('Error generating attendance range report:', error);
      res.status(500).json({ message: "Failed to generate attendance range report" });
    }
  });

  // Get students by batch and semester
  app.get("/api/students/:batchId/:semesterId", async (req, res) => {
    try {
      const { batchId, semesterId } = req.params;
      const students = await storage.getStudentsByBatchAndSemester(batchId, semesterId);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Get attendance for specific date and subject
  app.get("/api/attendance/:date/:subjectId", async (req, res) => {
    try {
      const { date, subjectId } = req.params;
      const attendance = await storage.getAttendanceByDateAndSubject(date, subjectId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Get attendance by date and subject (query parameters)
  app.get("/api/attendance", async (req, res) => {
    try {
      const { date, subjectId } = req.query;
      
      if (!date || !subjectId) {
        return res.status(400).json({ 
          message: "Date and subjectId are required" 
        });
      }

      const attendance = await storage.getAttendanceByDateAndSubject(date as string, subjectId as string);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Get student's attendance records
  app.get("/api/student-attendance/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const { subjectId, fromDate, toDate } = req.query;
      
      const attendance = await storage.getStudentAttendance(
        studentId, 
        subjectId as string,
        fromDate as string,
        toDate as string
      );
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student attendance" });
    }
  });

  // Get student's attendance range report
  app.get("/api/student-attendance-range/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const { subjectId, fromDate, toDate } = req.query;
      
      if (!fromDate || !toDate) {
        return res.status(400).json({ message: "fromDate and toDate are required" });
      }

      const report = await storage.getStudentAttendanceRangeReport(
        studentId,
        subjectId as string,
        fromDate as string,
        toDate as string
      );
      res.json(report);
    } catch (error) {
      console.error('Error generating student attendance range report:', error);
      res.status(500).json({ message: "Failed to generate student attendance range report" });
    }
  });

  // Mark attendance
  app.post("/api/attendance", async (req, res) => {
    try {
      console.log('Received attendance data:', req.body);
      const attendanceData = insertAttendanceSchema.parse(req.body);
      console.log('Parsed attendance data:', attendanceData);
      const attendance = await storage.createAttendance(attendanceData);
      console.log('Created attendance:', attendance);
      res.json(attendance);
    } catch (error) {
      console.error('Attendance creation error:', error);
      res.status(400).json({ message: "Invalid attendance data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Bulk mark attendance
  app.post("/api/attendance/bulk", async (req, res) => {
    try {
      const { attendanceRecords } = req.body;
      const results = [];
      
      for (const record of attendanceRecords) {
        const attendanceData = insertAttendanceSchema.parse(record);
        const attendance = await storage.createAttendance(attendanceData);
        results.push(attendance);
      }
      
      res.json(results);
    } catch (error) {
      res.status(400).json({ message: "Failed to save attendance records" });
    }
  });

  // Admin: Import data from GitHub CSVs
  app.post("/api/admin/import-from-github", async (req, res) => {
    try {
      const { token } = req.query;
      const expectedToken = process.env.IMPORT_TOKEN;
      
      if (!expectedToken || token !== expectedToken) {
        return res.status(401).json({ message: "Invalid or missing import token" });
      }

      console.log("Starting GitHub CSV import...");
      const stats = await importFromGitHub();
      
      res.json({
        message: "Import completed",
        stats: {
          imported: {
            users: stats.users,
            batches: stats.batches,
            semesters: stats.semesters,
            subjects: stats.subjects,
            teachers: stats.teachers,
            students: stats.students,
            attendance: stats.attendance
          },
          errors: stats.errors
        }
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Import failed", error: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
