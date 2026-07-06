import type { FastifyPluginAsync } from "fastify";
import { healthRoutes } from "../modules/health/health.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { usersRoutes } from "../modules/users/users.routes";
import { studentsRoutes } from "../modules/students/students.routes";
import { facultyRoutes } from "../modules/faculty/faculty.routes";
import { departmentsRoutes } from "../modules/departments/departments.routes";
import { examsRoutes } from "../modules/exams/exams.routes";
import { sessionsRoutes } from "../modules/sessions/sessions.routes";
import { questionsRoutes } from "../modules/questions/questions.routes";
import { analyticsRoutes } from "../modules/analytics/analytics.routes";
import { resultsRoutes } from "../modules/results/results.routes";
import { reportsRoutes } from "../modules/reports/reports.routes";
import { autosaveRoutes } from "../modules/autosave/autosave.routes";
import { autosubmitRoutes } from "../modules/autosubmit/autosubmit.routes";
import { settingsRoutes } from "../modules/settings/settings.routes";
import { codeExecutionRoutes } from "../modules/code-execution/code-execution.routes";

const routes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(studentsRoutes);
  await app.register(facultyRoutes);
  await app.register(departmentsRoutes);
  await app.register(examsRoutes);
  await app.register(sessionsRoutes);
  await app.register(questionsRoutes);
  await app.register(analyticsRoutes);
  await app.register(resultsRoutes);
  await app.register(reportsRoutes);
  await app.register(autosaveRoutes);
  await app.register(autosubmitRoutes);
  await app.register(settingsRoutes);
  await app.register(codeExecutionRoutes);
};

export default routes;
