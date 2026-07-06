import type { FastifyInstance } from "fastify";

export async function getSummary(app: FastifyInstance) {
  const [totalStudents, totalFaculty, totalExams, activeExams, examsConductedThisMonth, passStats] =
    await Promise.all([
      app.prisma.studentProfile.count(),
      app.prisma.facultyProfile.count(),
      app.prisma.exam.count(),
      app.prisma.exam.count({ where: { status: "ACTIVE" } }),
      app.prisma.exam.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      app.prisma.result.aggregate({
        _count: { passed: true },
        _avg: { percentage: true },
      }),
    ]);

  const totalResults = passStats._count.passed ?? 0;
  const avgPassRate = totalResults > 0 ? (passStats._count.passed / totalResults) * 100 : 0;

  return {
    totalStudents,
    totalFaculty,
    totalExams,
    avgPassRate,
    activeExams,
    examsConductedThisMonth,
  };
}

export async function getDepartmentStats(app: FastifyInstance) {
  const departments = await app.prisma.department.findMany({
    include: {
      students: {
        include: {
          enrollments: {
            include: {
              course: {
                include: {
                  exams: {
                    include: {
                      sessions: {
                        include: {
                          result: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return departments.map((dept: {
    id: string;
    name: string;
    students: Array<{
      enrollments: Array<{
        course: {
          exams: Array<{
            sessions: Array<{
              result: {
                percentage: number;
                passed: boolean;
              } | null;
            }>;
          }>;
        };
      }>;
    }>;
  }) => {
    let totalScore = 0;
    let scoreCount = 0;
    let passedCount = 0;
    let totalSessions = 0;

    for (const student of dept.students) {
      for (const enrollment of student.enrollments) {
        for (const exam of enrollment.course.exams) {
          for (const session of exam.sessions) {
            if (session.result) {
              totalScore += Number(session.result.percentage);
              scoreCount++;
              totalSessions++;
              if (session.result.passed) {
                passedCount++;
              }
            }
          }
        }
      }
    }

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      totalStudents: dept.students.length,
      avgScore: scoreCount > 0 ? totalScore / scoreCount : 0,
      passRate: totalSessions > 0 ? (passedCount / totalSessions) * 100 : 0,
    };
  });
}

export async function getExamPerformance(app: FastifyInstance) {
  const exams = await app.prisma.exam.findMany({
    include: {
      sessions: {
        include: {
          result: true,
        },
      },
    },
  });

  return exams.map((exam: {
    id: string;
    title: string;
    sessions: Array<{
      result: {
        percentage: number;
        passed: boolean;
      } | null;
    }>;
  }) => {
    let totalScore = 0;
    let scoreCount = 0;
    let passedCount = 0;

    for (const session of exam.sessions) {
      if (session.result) {
        totalScore += Number(session.result.percentage);
        scoreCount++;
        if (session.result.passed) {
          passedCount++;
        }
      }
    }

    return {
      examId: exam.id,
      examTitle: exam.title,
      avgScore: scoreCount > 0 ? totalScore / scoreCount : 0,
      passRate: scoreCount > 0 ? (passedCount / scoreCount) * 100 : 0,
      totalAppeared: exam.sessions.length,
    };
  });
}

export async function getMonthlyStats(app: FastifyInstance, year: number) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const results: Array<{
    month: string;
    examsCreated: number;
    studentsAppeared: number;
    avgScore: number;
  }> = [];

  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const startDate = new Date(year, monthIdx, 1);
    const endDate = new Date(year, monthIdx + 1, 0, 23, 59, 59);

    const [examsCreated, sessions, scoreAgg] = await Promise.all([
      app.prisma.exam.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      app.prisma.examSession.findMany({
        where: {
          startedAt: { gte: startDate, lte: endDate },
        },
        include: { result: true },
      }),
      app.prisma.result.aggregate({
        where: {
          evaluatedAt: { gte: startDate, lte: endDate },
        },
        _avg: { percentage: true },
      }),
    ]);

    const studentsAppeared = sessions.length;
    const avgScore = scoreAgg._avg.percentage
      ? Number(scoreAgg._avg.percentage)
      : 0;

    results.push({
      month: months[monthIdx],
      examsCreated,
      studentsAppeared,
      avgScore,
    });
  }

  return results;
}

export async function getStudentPerformance(app: FastifyInstance, studentUserId: string) {
  const sessions = await app.prisma.examSession.findMany({
    where: { studentUserId },
    include: {
      result: true,
      exam: true,
    },
    orderBy: { startedAt: "desc" },
  });

  const completedSessions = sessions.filter(
    (s: { result: null }) => s.result !== null,
  );

  const totalExamsTaken = completedSessions.length;
  let totalScore = 0;
  let bestScore = 0;
  let passedCount = 0;

  const recentResults = completedSessions.slice(0, 10).map((session: {
    exam: { id: string; title: string; totalMarks: number };
    result: { percentage: number; passed: boolean; obtainedMarks: number; maxMarks: number };
    startedAt: Date | null;
  }) => {
    const percentage = Number(session.result.percentage);
    totalScore += percentage;
    if (percentage > bestScore) bestScore = percentage;
    if (session.result.passed) passedCount++;

    return {
      examId: session.exam.id,
      examTitle: session.exam.title,
      score: session.result.obtainedMarks,
      maxScore: session.result.maxMarks,
      percentage,
      passed: session.result.passed,
      takenAt: (session.startedAt ?? new Date()).toISOString(),
    };
  });

  return {
    totalExamsTaken,
    avgScore: totalExamsTaken > 0 ? totalScore / totalExamsTaken : 0,
    bestScore,
    passRate: totalExamsTaken > 0 ? (passedCount / totalExamsTaken) * 100 : 0,
    recentResults,
  };
}

export async function getExamAnalytics(app: FastifyInstance, examId: string) {
  const exam = await app.prisma.exam.findUnique({
    where: { id: examId },
    include: {
      sessions: {
        include: { result: true },
      },
    },
  });

  if (!exam) return null;

  const completedSessions = exam.sessions.filter(
    (s: { result: null }) => s.result !== null,
  );

  let totalScore = 0;
  let passedCount = 0;
  const distribution: Record<string, number> = {
    "0-20": 0,
    "21-40": 0,
    "41-60": 0,
    "61-80": 0,
    "81-100": 0,
  };

  for (const session of completedSessions) {
    if (!session.result) continue;
    const percentage = Number(session.result.percentage);
    totalScore += percentage;
    if (session.result.passed) passedCount++;

    if (percentage <= 20) distribution["0-20"]++;
    else if (percentage <= 40) distribution["21-40"]++;
    else if (percentage <= 60) distribution["41-60"]++;
    else if (percentage <= 80) distribution["61-80"]++;
    else distribution["81-100"]++;
  }

  return {
    examId: exam.id,
    examTitle: exam.title,
    totalAppeared: exam.sessions.length,
    totalCompleted: completedSessions.length,
    avgScore: completedSessions.length > 0 ? totalScore / completedSessions.length : 0,
    passRate: completedSessions.length > 0 ? (passedCount / completedSessions.length) * 100 : 0,
    distribution,
  };
}
