import type { FastifyInstance } from "fastify";
import * as codeExecRepo from "./code-execution.repository";
import type { CodeRunResponse, RunCodeBody } from "./code-execution.schemas";

/**
 * Stub code runner — simulates execution.
 *
 * In production this would integrate with an isolated execution sandbox
 * (Judge0, Docker, Piston, etc.). Currently it returns a simulated "Hello World"
 * output for any code.
 */
export async function runCode(
  app: FastifyInstance,
  userId: string,
  body: RunCodeBody,
): Promise<CodeRunResponse> {
  const startTime = Date.now();

  // Simulated execution
  let stdout: string | null = `// Simulated output for ${body.language}\nHello, World!\n`;
  let stderr: string | null = null;
  let status = "COMPLETED";

  // Simulate basic output for common patterns
  if (body.sourceCode.includes("print") || body.sourceCode.includes("cout") || body.sourceCode.includes("System.out")) {
    stdout = `// Simulated execution output\nProgram executed successfully.\n`;
  }

  // Simulate syntax errors for empty or near-empty code
  if (body.sourceCode.trim().length < 5) {
    stdout = null;
    stderr = "Error: Empty source code.";
    status = "FAILED";
  }

  const executionTimeMs = Date.now() - startTime;

  const record = await codeExecRepo.createCodeRun(app, {
    userId,
    language: body.language,
    sourceCode: body.sourceCode,
    stdin: body.stdin,
    stdout: stdout ?? undefined,
    stderr: stderr ?? undefined,
    status,
    executionTimeMs,
  });

  return {
    id: record.id,
    language: record.language,
    sourceCode: record.sourceCode,
    stdin: record.stdin,
    stdout: record.stdout,
    stderr: record.stderr,
    status: record.status,
    executionTimeMs: record.executionTimeMs,
    createdAt: record.createdAt.toISOString(),
  };
}
