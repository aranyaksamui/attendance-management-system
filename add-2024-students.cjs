// Script to add 30 students for batch 2024 semester 5
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

// Since we can't import TypeScript directly, we'll create the database connection manually
const sqlite = new Database('dev.db');

async function add2024Students() {
  try {
    console.log('Starting to add 30 students for batch 2024 semester 5...');

    // Get batch 2024
    const batch2024 = sqlite.prepare('SELECT * FROM batches WHERE year = ?').all(2024);
    if (batch2024.length === 0) {
      console.log('❌ Batch 2024 not found. Creating it...');
      const batchId = crypto.randomUUID();
      sqlite.prepare('INSERT INTO batches (id, year, name) VALUES (?, ?, ?)').run(batchId, 2024, 'Batch 2024');
      batch2024[0] = { id: batchId, year: 2024, name: 'Batch 2024' };
    }

    // Get semester 5
    const semester5 = sqlite.prepare('SELECT * FROM semesters WHERE number = ?').all(5);
    if (semester5.length === 0) {
      console.log('❌ Semester 5 not found. Creating it...');
      const semesterId = crypto.randomUUID();
      sqlite.prepare('INSERT INTO semesters (id, number, name) VALUES (?, ?, ?)').run(semesterId, 5, 'Fifth Semester');
      semester5[0] = { id: semesterId, number: 5, name: 'Fifth Semester' };
    }

    console.log(`✅ Using batch: ${batch2024[0].name} (${batch2024[0].year})`);
    console.log(`✅ Using semester: ${semester5[0].name}`);

    // Student names for batch 2024
    const studentNames = [
      'Aarav Patel', 'Zara Ahmed', 'Krish Sharma', 'Maya Singh', 'Arjun Kumar',
      'Ananya Reddy', 'Vihaan Mehta', 'Ishita Gupta', 'Aditya Joshi', 'Kavya Nair',
      'Reyansh Malhotra', 'Diya Kapoor', 'Shaurya Verma', 'Kiara Bhat', 'Advait Iyer',
      'Aisha Khan', 'Dhruv Rao', 'Myra Choudhury', 'Kabir Saxena', 'Riya Menon',
      'Aarush Tiwari', 'Zara Sheikh', 'Krishna Das', 'Mira Banerjee', 'Arnav Reddy',
      'Anika Sharma', 'Vedant Patel', 'Ira Gupta', 'Aryan Singh', 'Kashvi Kumar'
    ];

    const studentData = [];
    for (let i = 0; i < 30; i++) {
      const hashedPassword = await bcrypt.hash('student123', 10);
      const userId = crypto.randomUUID();
      
      // Create user first
      sqlite.prepare('INSERT INTO users (id, email, password, role, name, createdAt) VALUES (?, ?, ?, ?, ?, ?)').run(
        userId,
        `student2024_${i + 1}@university.edu`,
        hashedPassword,
        'student',
        studentNames[i],
        Date.now()
      );

      // Create student record for batch 2024 semester 5
      const studentId = crypto.randomUUID();
      sqlite.prepare('INSERT INTO students (id, userId, rollNo, batchId, semesterId) VALUES (?, ?, ?, ?, ?)').run(
        studentId,
        userId,
        `S2024_${String(i + 1).padStart(2, '0')}`,
        batch2024[0].id,
        semester5[0].id
      );
      
      studentData.push({
        id: studentId,
        userId: userId,
        rollNo: `S2024_${String(i + 1).padStart(2, '0')}`,
        batchId: batch2024[0].id,
        semesterId: semester5[0].id
      });
    }
    
    console.log('✅ Created 30 students for batch 2024 semester 5');
    
    console.log('\n📊 Summary:');
    console.log(`   • Batch: ${batch2024[0].name} (${batch2024[0].year})`);
    console.log(`   • Semester: ${semester5[0].name}`);
    console.log(`   • Students: ${studentData.length}`);
    console.log('\n🔑 Default password: student123');

  } catch (error) {
    console.error('❌ Error adding 2024 students:', error);
  } finally {
    sqlite.close();
  }
}

add2024Students();
