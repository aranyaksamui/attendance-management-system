import { storage } from "./storage";
import { 
  insertUserSchema, insertBatchSchema, insertSemesterSchema, 
  insertSubjectSchema, insertTeacherSchema, insertStudentSchema, 
  insertAttendanceSchema 
} from "@shared/schema";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/aranyaksamui/attendance-management-system/master/exports";

interface ImportStats {
  users: number;
  batches: number;
  semesters: number;
  subjects: number;
  teachers: number;
  students: number;
  attendance: number;
  errors: string[];
}

async function fetchCSV(url: string): Promise<string[][]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const text = await response.text();
  
  return text.split('\n')
    .filter(line => line.trim())
    .map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
}

async function importUsers(csvData: string[][]): Promise<number> {
  const headers = csvData[0];
  const rows = csvData.slice(1);
  let count = 0;

  for (const row of rows) {
    try {
      const userData = {
        id: row[0],
        email: row[1],
        password: row[2],
        role: row[3],
        name: row[4],
        createdAt: parseInt(row[5]) || Date.now()
      };
      
      // Check if user already exists
      const existing = await storage.getUserByEmail(userData.email);
      if (!existing) {
        await storage.createUser(userData);
        count++;
      }
    } catch (error) {
      console.warn(`Failed to import user:`, error);
    }
  }
  return count;
}

async function importBatches(csvData: string[][]): Promise<number> {
  const headers = csvData[0];
  const rows = csvData.slice(1);
  let count = 0;

  for (const row of rows) {
    try {
      const batchData = {
        id: row[0],
        year: parseInt(row[1]),
        name: row[2]
      };
      
      await storage.createBatch(batchData);
      count++;
    } catch (error) {
      console.warn(`Failed to import batch:`, error);
    }
  }
  return count;
}

async function importSemesters(csvData: string[][]): Promise<number> {
  const headers = csvData[0];
  const rows = csvData.slice(1);
  let count = 0;

  for (const row of rows) {
    try {
      const semesterData = {
        id: row[0],
        number: parseInt(row[1]),
        name: row[2]
      };
      
      await storage.createSemester(semesterData);
      count++;
    } catch (error) {
      console.warn(`Failed to import semester:`, error);
    }
  }
  return count;
}

async function importSubjects(csvData: string[][]): Promise<number> {
  const headers = csvData[0];
  const rows = csvData.slice(1);
  let count = 0;

  for (const row of rows) {
    try {
      const subjectData = {
        id: row[0],
        name: row[1],
        code: row[2],
        semesterId: row[3] || null
      };
      
      await storage.createSubject(subjectData);
      count++;
    } catch (error) {
      console.warn(`Failed to import subject:`, error);
    }
  }
  return count;
}

async function importTeachers(csvData: string[][]): Promise<number> {
  const headers = csvData[0];
  const rows = csvData.slice(1);
  let count = 0;

  for (const row of rows) {
    try {
      const teacherData = {
        id: row[0],
        userId: row[1],
        employeeId: row[2]
      };
      
      await storage.createTeacher(teacherData);
      count++;
    } catch (error) {
      console.warn(`Failed to import teacher:`, error);
    }
  }
  return count;
}

async function importStudents(csvData: string[][]): Promise<number> {
  const headers = csvData[0];
  const rows = csvData.slice(1);
  let count = 0;

  for (const row of rows) {
    try {
      const studentData = {
        id: row[0],
        userId: row[1],
        rollNo: row[2],
        batchId: row[3],
        semesterId: row[4]
      };
      
      await storage.createStudent(studentData);
      count++;
    } catch (error) {
      console.warn(`Failed to import student:`, error);
    }
  }
  return count;
}

async function importAttendance(csvData: string[][]): Promise<number> {
  const headers = csvData[0];
  const rows = csvData.slice(1);
  let count = 0;

  for (const row of rows) {
    try {
      const attendanceData = {
        id: row[0],
        studentId: row[1],
        subjectId: row[2],
        teacherId: row[3],
        date: row[4],
        status: row[5] as 'present' | 'absent',
        createdAt: row[6] || new Date().toISOString()
      };
      
      await storage.createAttendance(attendanceData);
      count++;
    } catch (error) {
      console.warn(`Failed to import attendance:`, error);
    }
  }
  return count;
}

export async function importFromGitHub(): Promise<ImportStats> {
  const stats: ImportStats = {
    users: 0,
    batches: 0,
    semesters: 0,
    subjects: 0,
    teachers: 0,
    students: 0,
    attendance: 0,
    errors: []
  };

  try {
    // Import in dependency order
    console.log("Fetching and importing users...");
    const usersCSV = await fetchCSV(`${GITHUB_RAW_BASE}/users.csv`);
    stats.users = await importUsers(usersCSV);

    console.log("Fetching and importing batches...");
    const batchesCSV = await fetchCSV(`${GITHUB_RAW_BASE}/batches.csv`);
    stats.batches = await importBatches(batchesCSV);

    console.log("Fetching and importing semesters...");
    const semestersCSV = await fetchCSV(`${GITHUB_RAW_BASE}/semesters.csv`);
    stats.semesters = await importSemesters(semestersCSV);

    console.log("Fetching and importing subjects...");
    const subjectsCSV = await fetchCSV(`${GITHUB_RAW_BASE}/subjects.csv`);
    stats.subjects = await importSubjects(subjectsCSV);

    console.log("Fetching and importing teachers...");
    const teachersCSV = await fetchCSV(`${GITHUB_RAW_BASE}/teachers.csv`);
    stats.teachers = await importTeachers(teachersCSV);

    console.log("Fetching and importing students...");
    const studentsCSV = await fetchCSV(`${GITHUB_RAW_BASE}/students.csv`);
    stats.students = await importStudents(studentsCSV);

    console.log("Fetching and importing attendance...");
    const attendanceCSV = await fetchCSV(`${GITHUB_RAW_BASE}/attendance.csv`);
    stats.attendance = await importAttendance(attendanceCSV);

    console.log("Import completed successfully!");
  } catch (error) {
    stats.errors.push(`Import failed: ${error.message}`);
    console.error("Import failed:", error);
  }

  return stats;
}
