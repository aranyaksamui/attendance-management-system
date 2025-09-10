// Simple test script to test attendance creation
const testAttendance = async () => {
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
      console.log('❌ Not enough data to test attendance');
      return;
    }
    
    // Create a test attendance record
    const testAttendance = {
      studentId: students[0].id,
      subjectId: subjects[0].id,
      teacherId: teachers[0].id,
      date: new Date().toISOString(), // Send ISO string
      status: 'present'
    };
    
    console.log('Testing attendance creation with:', testAttendance);
    
    const response = await fetch('http://localhost:5000/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAttendance)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Attendance created successfully:', result);
    } else {
      const error = await response.text();
      console.log('❌ Failed to create attendance:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing attendance:', error);
  }
};

testAttendance();
