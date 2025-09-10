// Test script for bulk attendance creation
const testBulkAttendance = async () => {
  try {
    // First get some sample data to use
    const batchesResponse = await fetch('http://localhost:5000/api/batches');
    const batches = await batchesResponse.json();
    
    const studentsResponse = await fetch('http://localhost:5000/api/students');
    const students = await studentsResponse.json();
    
    const subjectsResponse = await fetch('http://localhost:5000/api/subjects');
    const subjects = await subjectsResponse.json();
    
    const teachersResponse = await fetch('http://localhost:5000/api/teachers');
    const teachers = await teachersResponse.json();
    
    if (batches.length === 0 || students.length === 0 || subjects.length === 0 || teachers.length === 0) {
      console.log('❌ Not enough data to test bulk attendance');
      return;
    }
    
    // Create multiple test attendance records
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      attendanceRecords.push({
        studentId: students[i].id,
        subjectId: subjects[0].id,
        teacherId: teachers[0].id,
        date: today.toISOString(),
        status: i % 2 === 0 ? 'present' : 'absent'
      });
    }
    
    console.log('Testing bulk attendance creation with:', attendanceRecords);
    
    const response = await fetch('http://localhost:5000/api/attendance/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attendanceRecords })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Bulk attendance created successfully:', result);
      console.log(`Created ${result.length} attendance records`);
    } else {
      const error = await response.text();
      console.log('❌ Failed to create bulk attendance:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing bulk attendance:', error);
  }
};

testBulkAttendance();
