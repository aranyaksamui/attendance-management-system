import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertAttendanceSchema } from "@shared/schema";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
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
      let additionalInfo = {};
      if (role === 'student') {
        const student = await storage.getStudentByUserId(user.id);
        additionalInfo = { student };
      } else if (role === 'teacher') {
        const teacher = await storage.getTeacherByUserId(user.id);
        additionalInfo = { teacher };
      }

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        }, 
        ...additionalInfo 
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

  // Mark attendance
  app.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(attendanceData);
      res.json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendance data" });
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

  const httpServer = createServer(app);
  return httpServer;
}
