import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema';
import bcrypt from 'bcrypt';

const sqlite = new Database('dev.db');
const db = drizzle(sqlite, { schema });

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing existing database data...');
    
    // Delete in reverse order to respect foreign key constraints
    await db.delete(schema.attendance);
    await db.delete(schema.students);
    await db.delete(schema.teachers);
    await db.delete(schema.subjects);
    await db.delete(schema.semesters);
    await db.delete(schema.batches);
    await db.delete(schema.users);
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

async function seedData() {
  try {
    console.log('🌱 Starting to seed database with new data...');

    // Clear existing data first
    await clearDatabase();

    // Create sessions (batches) from 2022-2025
    const batchData = [];
    for (let year = 2022; year <= 2025; year++) {
      batchData.push({
        id: crypto.randomUUID(),
        year: year,
        name: `Session ${year}`
      });
    }
    
    await db.insert(schema.batches).values(batchData);
    console.log('✅ Created 4 sessions (2022-2025)');

    // Create 8 semesters
    const semesterData = [
      { id: crypto.randomUUID(), number: 1, name: 'First Semester' },
      { id: crypto.randomUUID(), number: 2, name: 'Second Semester' },
      { id: crypto.randomUUID(), number: 3, name: 'Third Semester' },
      { id: crypto.randomUUID(), number: 4, name: 'Fourth Semester' },
      { id: crypto.randomUUID(), number: 5, name: 'Fifth Semester' },
      { id: crypto.randomUUID(), number: 6, name: 'Sixth Semester' },
      { id: crypto.randomUUID(), number: 7, name: 'Seventh Semester' },
      { id: crypto.randomUUID(), number: 8, name: 'Eighth Semester' }
    ];
    
    await db.insert(schema.semesters).values(semesterData);
    console.log('✅ Created 8 semesters');

    // Create realistic subjects for each semester (5 subjects per semester)
    const subjectData = [
      // Semester 1 - Foundation subjects
      { id: crypto.randomUUID(), name: 'Mathematics I', code: 'MATH101', semesterId: semesterData[0].id },
      { id: crypto.randomUUID(), name: 'Physics I', code: 'PHY101', semesterId: semesterData[0].id },
      { id: crypto.randomUUID(), name: 'Chemistry', code: 'CHEM101', semesterId: semesterData[0].id },
      { id: crypto.randomUUID(), name: 'English Communication', code: 'ENG101', semesterId: semesterData[0].id },
      { id: crypto.randomUUID(), name: 'Computer Fundamentals', code: 'CS101', semesterId: semesterData[0].id },

      // Semester 2 - Basic Engineering
      { id: crypto.randomUUID(), name: 'Mathematics II', code: 'MATH102', semesterId: semesterData[1].id },
      { id: crypto.randomUUID(), name: 'Physics II', code: 'PHY102', semesterId: semesterData[1].id },
      { id: crypto.randomUUID(), name: 'Basic Electronics', code: 'ECE101', semesterId: semesterData[1].id },
      { id: crypto.randomUUID(), name: 'Engineering Drawing', code: 'ME101', semesterId: semesterData[1].id },
      { id: crypto.randomUUID(), name: 'Programming in C', code: 'CS102', semesterId: semesterData[1].id },

      // Semester 3 - Core Computer Science
      { id: crypto.randomUUID(), name: 'Data Structures', code: 'CS201', semesterId: semesterData[2].id },
      { id: crypto.randomUUID(), name: 'Digital Logic Design', code: 'CS202', semesterId: semesterData[2].id },
      { id: crypto.randomUUID(), name: 'Discrete Mathematics', code: 'MATH201', semesterId: semesterData[2].id },
      { id: crypto.randomUUID(), name: 'Object Oriented Programming', code: 'CS203', semesterId: semesterData[2].id },
      { id: crypto.randomUUID(), name: 'Computer Organization', code: 'CS204', semesterId: semesterData[2].id },

      // Semester 4 - Advanced Programming
      { id: crypto.randomUUID(), name: 'Algorithms', code: 'CS301', semesterId: semesterData[3].id },
      { id: crypto.randomUUID(), name: 'Database Management Systems', code: 'CS302', semesterId: semesterData[3].id },
      { id: crypto.randomUUID(), name: 'Computer Networks', code: 'CS303', semesterId: semesterData[3].id },
      { id: crypto.randomUUID(), name: 'Software Engineering', code: 'CS304', semesterId: semesterData[3].id },
      { id: crypto.randomUUID(), name: 'Operating Systems', code: 'CS305', semesterId: semesterData[3].id },

      // Semester 5 - Specialized Topics
      { id: crypto.randomUUID(), name: 'Web Technologies', code: 'CS401', semesterId: semesterData[4].id },
      { id: crypto.randomUUID(), name: 'Computer Graphics', code: 'CS402', semesterId: semesterData[4].id },
      { id: crypto.randomUUID(), name: 'Microprocessors', code: 'CS403', semesterId: semesterData[4].id },
      { id: crypto.randomUUID(), name: 'Theory of Computation', code: 'CS404', semesterId: semesterData[4].id },
      { id: crypto.randomUUID(), name: 'Artificial Intelligence', code: 'CS405', semesterId: semesterData[4].id },

      // Semester 6 - Advanced Systems
      { id: crypto.randomUUID(), name: 'Compiler Design', code: 'CS501', semesterId: semesterData[5].id },
      { id: crypto.randomUUID(), name: 'Distributed Systems', code: 'CS502', semesterId: semesterData[5].id },
      { id: crypto.randomUUID(), name: 'Information Security', code: 'CS503', semesterId: semesterData[5].id },
      { id: crypto.randomUUID(), name: 'Mobile Computing', code: 'CS504', semesterId: semesterData[5].id },
      { id: crypto.randomUUID(), name: 'Data Mining', code: 'CS505', semesterId: semesterData[5].id },

      // Semester 7 - Professional Development
      { id: crypto.randomUUID(), name: 'Machine Learning', code: 'CS601', semesterId: semesterData[6].id },
      { id: crypto.randomUUID(), name: 'Cloud Computing', code: 'CS602', semesterId: semesterData[6].id },
      { id: crypto.randomUUID(), name: 'Big Data Analytics', code: 'CS603', semesterId: semesterData[6].id },
      { id: crypto.randomUUID(), name: 'Project Management', code: 'CS604', semesterId: semesterData[6].id },
      { id: crypto.randomUUID(), name: 'Ethics in Computing', code: 'CS605', semesterId: semesterData[6].id },

      // Semester 8 - Capstone and Electives
      { id: crypto.randomUUID(), name: 'Final Year Project', code: 'CS701', semesterId: semesterData[7].id },
      { id: crypto.randomUUID(), name: 'Advanced Algorithms', code: 'CS702', semesterId: semesterData[7].id },
      { id: crypto.randomUUID(), name: 'Blockchain Technology', code: 'CS703', semesterId: semesterData[7].id },
      { id: crypto.randomUUID(), name: 'Internet of Things', code: 'CS704', semesterId: semesterData[7].id },
      { id: crypto.randomUUID(), name: 'Cybersecurity', code: 'CS705', semesterId: semesterData[7].id }
    ];
    
    await db.insert(schema.subjects).values(subjectData);
    console.log('✅ Created 40 subjects (5 per semester)');

    // Create teachers
    const teacherNames = [
      'Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez', 'Prof. David Kim',
      'Dr. Lisa Thompson', 'Prof. James Wilson', 'Dr. Maria Garcia', 'Prof. Robert Brown',
      'Dr. Jennifer Lee', 'Prof. Christopher Davis', 'Dr. Amanda White', 'Prof. Daniel Miller',
      'Dr. Rachel Green', 'Prof. Kevin Taylor', 'Dr. Nicole Anderson', 'Prof. Steven Martinez',
      'Dr. Jessica Clark', 'Prof. Andrew Lewis', 'Dr. Michelle Walker', 'Prof. Brian Hall'
    ];

    const teacherData = [];
    for (let i = 0; i < 20; i++) {
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      const userId = crypto.randomUUID();
      
      // Create user first
      await db.insert(schema.users).values({
        id: userId,
        email: `teacher${i + 1}@university.edu`,
        password: hashedPassword,
        role: 'teacher',
        name: teacherNames[i]
      });

      // Create teacher record
      teacherData.push({
        id: crypto.randomUUID(),
        userId: userId,
        employeeId: `T${String(i + 1).padStart(3, '0')}`
      });
    }
    
    await db.insert(schema.teachers).values(teacherData);
    console.log('✅ Created 20 teachers');

    // Student names provided
    const studentNames = [
      'Ananya Chopra', 'Aadhya Menon', 'Vihaan Das', 'Sai Jha', 'Ira Iyer',
      'Reyansh Banerjee', 'Aarohi Singh', 'Saanvi Das', 'Aditya Menon', 'Diya Banerjee',
      'Aarav Mishra', 'Ananya Banerjee', 'Vihaan Rao', 'Anika Menon', 'Sai Singh',
      'Vihaan Reddy', 'Aadhya Ghosh', 'Vivaan Das', 'Vihaan Mishra', 'Vihaan Patel',
      'Rohan Mehta', 'Myra Pandey', 'Sara Iyer', 'Sara Pandey', 'Vihaan Singh',
      'Diya Yadav', 'Myra Menon', 'Krishna Mehta', 'Diya Das', 'Krishna Mishra',
      'Ira Patel', 'Navya Yadav', 'Sai Mehta', 'Krishna Patel', 'Ananya Mehta',
      'Anika Singh', 'Vihaan Verma', 'Reyansh Yadav', 'Krishna Iyer', 'Reyansh Ghosh',
      'Ishaan Bose', 'Sara Sharma', 'Arjun Patel', 'Sai Iyer', 'Saanvi Jha',
      'Diya Pandey', 'Aditya Mishra', 'Reyansh Das', 'Ishaan Verma', 'Navya Pandey',
      'Sara Jha', 'Diya Singh', 'Aarohi Sharma', 'Sara Reddy', 'Rohan Menon',
      'Rohan Rao', 'Sara Banerjee', 'Aadhya Reddy', 'Krishna Jha', 'Krishna Reddy',
      'Rohan Verma', 'Sara Yadav', 'Ananya Singh', 'Vivaan Mehta', 'Aarav Banerjee',
      'Anika Kapoor', 'Ishaan Jha', 'Rohan Mishra', 'Sara Das', 'Navya Kapoor',
      'Aditya Patel', 'Reyansh Verma', 'Ishaan Kapoor', 'Arjun Yadav', 'Aditya Kapoor',
      'Reyansh Sharma', 'Ira Mishra', 'Aadhya Sharma', 'Diya Nair', 'Navya Das',
      'Ishaan Menon', 'Myra Verma', 'Aadhya Mishra', 'Reyansh Mishra', 'Vivaan Menon',
      'Ananya Nair', 'Aditya Rao', 'Myra Rao', 'Reyansh Rao', 'Navya Mehta',
      'Aditya Verma', 'Vihaan Nair', 'Arjun Banerjee', 'Aarohi Verma', 'Navya Rao',
      'Ananya Mishra', 'Diya Verma', 'Sara Rao', 'Arjun Rao', 'Myra Singh',
      'Aadhya Mehta', 'Ira Mehta', 'Saanvi Bose', 'Ananya Yadav', 'Myra Jha',
      'Aarav Jha', 'Sai Reddy', 'Navya Iyer', 'Aditya Banerjee', 'Vivaan Banerjee',
      'Krishna Sharma', 'Aadhya Banerjee', 'Sara Ghosh', 'Vihaan Iyer', 'Reyansh Mehta',
      'Saanvi Mehta', 'Navya Sharma', 'Sai Patel', 'Rohan Patel', 'Anika Reddy',
      'Myra Mehta', 'Rohan Ghosh', 'Sara Menon', 'Ishaan Menon', 'Aarohi Mehta',
      'Diya Iyer', 'Saanvi Menon', 'Aarohi Jha', 'Ira Menon', 'Sai Bose',
      'Vivaan Bose', 'Aadhya Patel', 'Rohan Nair', 'Krishna Nair', 'Vihaan Banerjee',
      'Aditya Jha', 'Vivaan Jha', 'Sara Kapoor', 'Reyansh Menon', 'Anika Banerjee',
      'Diya Bose', 'Myra Nair', 'Aditya Das', 'Reyansh Bose', 'Saanvi Sharma',
      'Aadhya Yadav', 'Krishna Verma', 'Sai Mishra', 'Vivaan Mishra', 'Rohan Sharma',
      'Ira Sharma', 'Diya Mishra', 'Anika Patel', 'Ananya Rao', 'Aadhya Rao',
      'Ira Reddy', 'Sara Patel', 'Saanvi Patel', 'Aditya Sharma', 'Reyansh Sharma',
      'Aarohi Menon', 'Sai Verma', 'Vihaan Sharma', 'Vivaan Sharma', 'Arjun Sharma',
      'Krishna Banerjee', 'Aarav Sharma', 'Saanvi Rao', 'Sara Verma', 'Rohan Reddy',
      'Aditya Iyer', 'Diya Iyer', 'Ishaan Sharma', 'Ananya Bose', 'Vivaan Kapoor',
      'Navya Reddy', 'Krishna Rao', 'Aarohi Rao', 'Aditya Menon', 'Ishaan Nair',
      'Sai Yadav', 'Reyansh Jha', 'Myra Banerjee', 'Vihaan Kapoor', 'Navya Nair',
      'Aarohi Kapoor', 'Anika Kapoor', 'Sara Kapoor', 'Diya Kapoor', 'Saanvi Kapoor',
      'Aditya Kapoor', 'Vivaan Kapoor', 'Arjun Kapoor', 'Krishna Kapoor', 'Rohan Kapoor',
      'Navya Kapoor', 'Ira Kapoor', 'Sai Kapoor', 'Reyansh Kapoor', 'Ishaan Kapoor',
      'Myra Kapoor', 'Aadhya Kapoor', 'Ananya Kapoor', 'Vihaan Kapoor', 'Aarav Kapoor',
      'Aarohi Kapoor', 'Saanvi Kapoor', 'Sara Kapoor', 'Aditya Kapoor', 'Reyansh Kapoor',
      'Ishaan Kapoor', 'Vivaan Kapoor', 'Myra Kapoor', 'Navya Kapoor', 'Ananya Kapoor',
      'Aadhya Kapoor', 'Krishna Kapoor', 'Rohan Kapoor', 'Ira Kapoor', 'Sai Kapoor'
    ];

    const studentData = [];
    let studentCounter = 1;

    // Academic year logic:
    // 2022 session -> 4th year (7th-8th semester) - students who started in 2019
    // 2023 session -> 3rd year (5th-6th semester) - students who started in 2020  
    // 2024 session -> 2nd year (3rd-4th semester) - students who started in 2021
    // 2025 session -> 1st year (1st-2nd semester) - students who started in 2022

    for (let sessionIndex = 0; sessionIndex < batchData.length; sessionIndex++) {
      const batch = batchData[sessionIndex];
      const sessionYear = batch.year;
      
      // Determine which semesters this session should have students in
      let targetSemesters: number[] = [];
      
      if (sessionYear === 2022) {
        // 4th year students - 7th and 8th semester
        targetSemesters = [6, 7]; // 0-indexed
      } else if (sessionYear === 2023) {
        // 3rd year students - 5th and 6th semester
        targetSemesters = [4, 5]; // 0-indexed
      } else if (sessionYear === 2024) {
        // 2nd year students - 3rd and 4th semester
        targetSemesters = [2, 3]; // 0-indexed
      } else if (sessionYear === 2025) {
        // 1st year students - 1st and 2nd semester
        targetSemesters = [0, 1]; // 0-indexed
      }

      // Create 10 students for each target semester
      for (const semesterIndex of targetSemesters) {
        const semester = semesterData[semesterIndex];
        
        for (let i = 0; i < 10; i++) {
          const hashedPassword = await bcrypt.hash('student123', 10);
          const userId = crypto.randomUUID();
          
          // Create user first
          await db.insert(schema.users).values({
            id: userId,
            email: `student${studentCounter}@university.edu`,
            password: hashedPassword,
            role: 'student',
            name: studentNames[studentCounter - 1]
          });

          // Create student record
          studentData.push({
            id: crypto.randomUUID(),
            userId: userId,
            rollNo: `${sessionYear}${String(i + 1).padStart(2, '0')}${semesterIndex + 1}`,
            batchId: batch.id,
            semesterId: semester.id
          });

          studentCounter++;
        }
      }
    }
    
    await db.insert(schema.students).values(studentData);
    console.log('✅ Created 320 students (10 per semester per session)');

    // Create some sample attendance records
    const attendanceData = [];
    const statuses = ['present', 'absent'];
    
    // Create attendance for last 30 days for random students and subjects
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      // Create 15-25 attendance records per day
      const recordsPerDay = Math.floor(Math.random() * 11) + 15;
      
      for (let record = 0; record < recordsPerDay; record++) {
        const randomStudent = studentData[Math.floor(Math.random() * studentData.length)];
        const randomSubject = subjectData[Math.floor(Math.random() * subjectData.length)];
        const randomTeacher = teacherData[Math.floor(Math.random() * teacherData.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        attendanceData.push({
          id: crypto.randomUUID(),
          studentId: randomStudent.id,
          subjectId: randomSubject.id,
          teacherId: randomTeacher.id,
          date: date.toISOString(),
          status: randomStatus,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    await db.insert(schema.attendance).values(attendanceData);
    console.log(`✅ Created ${attendanceData.length} attendance records`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${batchData.length} sessions (2022-2025)`);
    console.log(`   • ${semesterData.length} semesters (1-8)`);
    console.log(`   • ${subjectData.length} subjects (5 per semester)`);
    console.log(`   • ${teacherData.length} teachers`);
    console.log(`   • ${studentData.length} students (10 per semester per session)`);
    console.log(`   • ${attendanceData.length} attendance records`);
    
    console.log('\n🔑 Default passwords:');
    console.log('   • Teachers: teacher123');
    console.log('   • Students: student123');

    console.log('\n📚 Academic Year Distribution:');
    console.log('   • 2022 Session: 4th year students (7th-8th semester)');
    console.log('   • 2023 Session: 3rd year students (5th-6th semester)');
    console.log('   • 2024 Session: 2nd year students (3rd-4th semester)');
    console.log('   • 2025 Session: 1st year students (1st-2nd semester)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    sqlite.close();
  }
}

seedData();