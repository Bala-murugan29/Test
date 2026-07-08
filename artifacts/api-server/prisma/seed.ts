import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const PERMISSION_DEFS = [
  { key: "exam:create", name: "Create Exam", description: "Can create exams" },
  { key: "exam:read", name: "Read Exam", description: "Can view exams" },
  { key: "exam:update", name: "Update Exam", description: "Can update exams" },
  { key: "exam:delete", name: "Delete Exam", description: "Can delete exams" },
  { key: "exam:publish", name: "Publish Exam", description: "Can publish exams" },
  { key: "exam:archive", name: "Archive Exam", description: "Can archive exams" },
  { key: "question:create", name: "Create Question", description: "Can create questions" },
  { key: "question:read", name: "Read Question", description: "Can view questions" },
  { key: "question:update", name: "Update Question", description: "Can update questions" },
  { key: "question:delete", name: "Delete Question", description: "Can delete questions" },
  { key: "question:approve", name: "Approve Question", description: "Can approve or review questions" },
  { key: "user:create", name: "Create User", description: "Can create users" },
  { key: "user:read", name: "Read User", description: "Can view users" },
  { key: "user:update", name: "Update User", description: "Can update users" },
  { key: "user:delete", name: "Delete User", description: "Can delete users" },
  { key: "user:manage", name: "Manage Users", description: "Full user management" },
  { key: "role:manage", name: "Manage Roles", description: "Can manage roles and permissions" },
  { key: "department:manage", name: "Manage Departments", description: "Can manage departments" },
  { key: "course:create", name: "Create Course", description: "Can create courses" },
  { key: "course:read", name: "Read Course", description: "Can view courses" },
  { key: "course:update", name: "Update Course", description: "Can update courses" },
  { key: "course:delete", name: "Delete Course", description: "Can delete courses" },
  { key: "student:manage", name: "Manage Students", description: "Can manage student profiles" },
  { key: "student:read", name: "Read Student", description: "Can view student profiles" },
  { key: "faculty:manage", name: "Manage Faculty", description: "Can manage faculty profiles" },
  { key: "faculty:read", name: "Read Faculty", description: "Can view faculty profiles" },
  { key: "result:read", name: "Read Result", description: "Can view results" },
  { key: "result:evaluate", name: "Evaluate Result", description: "Can evaluate exam results" },
  { key: "result:manage", name: "Manage Results", description: "Full result management" },
  { key: "session:manage", name: "Manage Sessions", description: "Can manage exam sessions" },
  { key: "analytics:view", name: "View Analytics", description: "Can view analytics" },
  { key: "reports:view", name: "View Reports", description: "Can view reports" },
  { key: "settings:manage", name: "Manage Settings", description: "Can manage system settings" },
] as const;

const FACULTY_PERM_KEYS = [
  "exam:create", "exam:read", "exam:update", "exam:publish", "exam:archive",
  "question:create", "question:read", "question:update", "question:approve",
  "course:create", "course:read", "course:update",
  "student:read",
  "result:read", "result:evaluate",
  "analytics:view", "reports:view",
] as const;

const STUDENT_PERM_KEYS = [
  "exam:read", "result:read",
] as const;

async function main() {
  console.log("Seeding database...");

  // 1. Create roles
  const adminRole = await prisma.role.upsert({
    where: { key: "admin" },
    update: {},
    create: { key: "admin", name: "Admin", description: "System administrator with full access", isSystem: true },
  });

  const facultyRole = await prisma.role.upsert({
    where: { key: "faculty" },
    update: {},
    create: { key: "faculty", name: "Faculty", description: "Faculty member who can create and manage exams", isSystem: true },
  });

  const studentRole = await prisma.role.upsert({
    where: { key: "student" },
    update: {},
    create: { key: "student", name: "Student", description: "Student who can take exams", isSystem: true },
  });

  console.log("Roles created");

  // 2. Create permissions
  const permMap: Record<string, string> = {};
  for (const def of PERMISSION_DEFS) {
    const perm = await prisma.permission.upsert({
      where: { key: def.key },
      update: { name: def.name, description: def.description },
      create: def,
    });
    permMap[def.key] = perm.id;
  }

  console.log("Permissions created");

  // 3. Assign permissions to roles
  // Admin — all permissions
  for (const id of Object.values(permMap)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: id },
    });
  }

  // Faculty — selected permissions
  for (const key of FACULTY_PERM_KEYS) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: facultyRole.id, permissionId: permMap[key] } },
      update: {},
      create: { roleId: facultyRole.id, permissionId: permMap[key] },
    });
  }

  // Student — minimal permissions
  for (const key of STUDENT_PERM_KEYS) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: studentRole.id, permissionId: permMap[key] } },
      update: {},
      create: { roleId: studentRole.id, permissionId: permMap[key] },
    });
  }

  console.log("Permissions assigned to roles");

  // 4. Create departments
  const csDept = await prisma.department.upsert({
    where: { code: "CS" },
    update: {},
    create: { code: "CS", name: "Computer Science", description: "Department of Computer Science" },
  });

  const itDept = await prisma.department.upsert({
    where: { code: "IT" },
    update: {},
    create: { code: "IT", name: "Information Technology", description: "Department of Information Technology" },
  });

  console.log("Departments created");

  // 5. Create demo users
  const hashes = await Promise.all([
    bcrypt.hash("password123", SALT_ROUNDS),
    bcrypt.hash("password123", SALT_ROUNDS),
    bcrypt.hash("password123", SALT_ROUNDS),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { email: "rajesh.kumar@university.edu" },
    update: {},
    create: { email: "rajesh.kumar@university.edu", passwordHash: hashes[0], fullName: "Rajesh Kumar", status: "ACTIVE" },
  });

  const facultyUser = await prisma.user.upsert({
    where: { email: "priya.mehta@university.edu" },
    update: {},
    create: { email: "priya.mehta@university.edu", passwordHash: hashes[1], fullName: "Dr. Priya Mehta", status: "ACTIVE" },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "arjun.sharma@university.edu" },
    update: {},
    create: { email: "arjun.sharma@university.edu", passwordHash: hashes[2], fullName: "Arjun Sharma", status: "ACTIVE" },
  });

  console.log("Users created");

  // 6. Assign roles to users
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: facultyUser.id, roleId: facultyRole.id } },
    update: {},
    create: { userId: facultyUser.id, roleId: facultyRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: studentUser.id, roleId: studentRole.id } },
    update: {},
    create: { userId: studentUser.id, roleId: studentRole.id },
  });

  console.log("Roles assigned to users");

  // 7. Create FacultyProfile for admin user
  await prisma.facultyProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      departmentId: csDept.id,
      employeeNumber: "ADM001",
      designation: "Senior Administrator",
    },
  });

  // Create FacultyProfile for faculty user
  await prisma.facultyProfile.upsert({
    where: { userId: facultyUser.id },
    update: {},
    create: {
      userId: facultyUser.id,
      departmentId: csDept.id,
      employeeNumber: "FAC001",
      designation: "Assistant Professor",
    },
  });

  // Create StudentProfile for student user
  await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      departmentId: csDept.id,
      studentNumber: "STU001",
      admissionYear: 2024,
      currentSemester: 3,
    },
  });

  console.log("Profiles created for seeded users");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
