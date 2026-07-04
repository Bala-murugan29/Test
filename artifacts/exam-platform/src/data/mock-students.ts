export interface StudentRecord {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  year: number;
  cgpa: number;
  examsTaken: number;
  examsCleared: number;
  avgScore: number;
  status: 'active' | 'suspended';
  enrolledAt: string;
}

export const studentRecords: StudentRecord[] = [
  { id: 's001', rollNumber: 'CS2021001', name: 'Arjun Sharma', email: 'arjun.sharma@university.edu', department: 'Computer Science', year: 3, cgpa: 8.4, examsTaken: 12, examsCleared: 11, avgScore: 74, status: 'active', enrolledAt: '2021-07-15' },
  { id: 's002', rollNumber: 'CS2021002', name: 'Priya Singh', email: 'priya.singh@university.edu', department: 'Computer Science', year: 3, cgpa: 9.1, examsTaken: 12, examsCleared: 12, avgScore: 88, status: 'active', enrolledAt: '2021-07-15' },
  { id: 's005', rollNumber: 'CS2021005', name: 'Vikram Nair', email: 'vikram.nair@university.edu', department: 'Computer Science', year: 3, cgpa: 7.8, examsTaken: 10, examsCleared: 8, avgScore: 65, status: 'active', enrolledAt: '2021-07-15' },
  { id: 's006', rollNumber: 'CS2022001', name: 'Ananya Krishnan', email: 'ananya.k@university.edu', department: 'Computer Science', year: 2, cgpa: 8.9, examsTaken: 6, examsCleared: 6, avgScore: 82, status: 'active', enrolledAt: '2022-07-18' },
  { id: 's007', rollNumber: 'CS2022002', name: 'Rahul Gupta', email: 'rahul.gupta@university.edu', department: 'Computer Science', year: 2, cgpa: 7.2, examsTaken: 6, examsCleared: 4, avgScore: 58, status: 'active', enrolledAt: '2022-07-18' },
  { id: 's003', rollNumber: 'EC2021001', name: 'Rohit Verma', email: 'rohit.verma@university.edu', department: 'Electronics', year: 3, cgpa: 7.5, examsTaken: 10, examsCleared: 8, avgScore: 62, status: 'active', enrolledAt: '2021-07-15' },
  { id: 's008', rollNumber: 'EC2021002', name: 'Deepika Rao', email: 'deepika.rao@university.edu', department: 'Electronics', year: 3, cgpa: 8.2, examsTaken: 10, examsCleared: 10, avgScore: 76, status: 'active', enrolledAt: '2021-07-15' },
  { id: 's009', rollNumber: 'EC2022001', name: 'Karan Mehta', email: 'karan.mehta@university.edu', department: 'Electronics', year: 2, cgpa: 6.8, examsTaken: 5, examsCleared: 3, avgScore: 51, status: 'suspended', enrolledAt: '2022-07-18' },
  { id: 's004', rollNumber: 'ME2021001', name: 'Sneha Patel', email: 'sneha.patel@university.edu', department: 'Mechanical', year: 3, cgpa: 7.9, examsTaken: 11, examsCleared: 9, avgScore: 70, status: 'active', enrolledAt: '2021-07-15' },
  { id: 's010', rollNumber: 'ME2021002', name: 'Amit Tiwari', email: 'amit.tiwari@university.edu', department: 'Mechanical', year: 3, cgpa: 8.6, examsTaken: 11, examsCleared: 11, avgScore: 81, status: 'active', enrolledAt: '2021-07-15' },
  { id: 's011', rollNumber: 'ME2022001', name: 'Pooja Reddy', email: 'pooja.reddy@university.edu', department: 'Mechanical', year: 2, cgpa: 7.3, examsTaken: 4, examsCleared: 3, avgScore: 63, status: 'active', enrolledAt: '2022-07-18' },
  { id: 's012', rollNumber: 'CV2021001', name: 'Suraj Pande', email: 'suraj.pande@university.edu', department: 'Civil', year: 3, cgpa: 8.0, examsTaken: 9, examsCleared: 8, avgScore: 73, status: 'active', enrolledAt: '2021-07-15' },
  { id: 's013', rollNumber: 'CV2022001', name: 'Nisha Kulkarni', email: 'nisha.k@university.edu', department: 'Civil', year: 2, cgpa: 7.6, examsTaken: 5, examsCleared: 4, avgScore: 67, status: 'active', enrolledAt: '2022-07-18' },
  { id: 's014', rollNumber: 'IT2021001', name: 'Manish Joshi', email: 'manish.joshi@university.edu', department: 'Information Technology', year: 3, cgpa: 8.3, examsTaken: 12, examsCleared: 11, avgScore: 77, status: 'active', enrolledAt: '2021-07-15' },
  { id: 's015', rollNumber: 'IT2022001', name: 'Riya Desai', email: 'riya.desai@university.edu', department: 'Information Technology', year: 2, cgpa: 9.0, examsTaken: 6, examsCleared: 6, avgScore: 89, status: 'active', enrolledAt: '2022-07-18' },
];
