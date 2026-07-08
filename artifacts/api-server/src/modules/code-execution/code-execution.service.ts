import type { FastifyInstance } from "fastify";
import * as codeExecRepo from "./code-execution.repository";
import type { CodeRunResponse, RunCodeBody } from "./code-execution.schemas";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

interface RunResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  timeMs: number;
}

function runCommand(
  cmd: string,
  args: string[],
  stdin: string,
  timeoutMs = 5000
): Promise<RunResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn(cmd, args);

    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const timeMs = Date.now() - startTime;
      resolve({
        stdout,
        stderr: killed ? "Time Limit Exceeded" : stderr,
        code,
        signal,
        timeMs,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      const timeMs = Date.now() - startTime;
      resolve({
        stdout,
        stderr: err.message,
        code: -1,
        signal: null,
        timeMs,
      });
    });

    // Always write stdin data (even if empty) and ensure trailing newline
    // so that input() / scanf / Scanner.next() can properly read
    try {
      const stdinData = stdin.length > 0 && !stdin.endsWith("\n") ? stdin + "\n" : stdin;
      child.stdin.write(stdinData);
      child.stdin.end();
    } catch (err) {
      // ignore stdin write failure if child process terminated instantly
    }
  });
}

/**
 * Executes user code (C, C++, Python, or Java) securely inside the environment.
 */
export async function runCode(
  app: FastifyInstance,
  userId: string,
  body: RunCodeBody,
): Promise<CodeRunResponse> {
  const runId = crypto.randomUUID();
  const runDir = path.join(os.tmpdir(), `exam-run-${runId}`);

  let stdout = "";
  let stderr = "";
  let status = "COMPLETED";
  let executionTimeMs = 0;

  const isWin = process.platform === "win32";
  const stdinValue = body.stdin ?? "";

  try {
    await fs.mkdir(runDir, { recursive: true });

    const lang = body.language.toLowerCase();
    if (lang === "c") {
      const sourceFile = path.join(runDir, "solution.c");
      const binFile = path.join(runDir, isWin ? "solution.exe" : "solution");
      await fs.writeFile(sourceFile, body.sourceCode);

      // Compile C code
      const compileRes = await runCommand("gcc", ["-O2", "-Wall", sourceFile, "-o", binFile], "", 10000);
      if (compileRes.code !== 0) {
        status = "FAILED";
        stderr = `Compile Error:\n${compileRes.stderr}`;
        executionTimeMs = compileRes.timeMs;
      } else {
        // Run binary
        const runRes = await runCommand(binFile, [], stdinValue, 5000);
        stdout = runRes.stdout;
        stderr = runRes.stderr;
        executionTimeMs = runRes.timeMs;
        if (runRes.code !== 0 || runRes.signal) {
          status = "FAILED";
        }
      }
    } else if (lang === "cpp") {
      const sourceFile = path.join(runDir, "solution.cpp");
      const binFile = path.join(runDir, isWin ? "solution.exe" : "solution");
      await fs.writeFile(sourceFile, body.sourceCode);

      // Compile C++ code
      const compileRes = await runCommand("g++", ["-O2", "-Wall", "-std=c++17", sourceFile, "-o", binFile], "", 10000);
      if (compileRes.code !== 0) {
        status = "FAILED";
        stderr = `Compile Error:\n${compileRes.stderr}`;
        executionTimeMs = compileRes.timeMs;
      } else {
        // Run binary
        const runRes = await runCommand(binFile, [], stdinValue, 5000);
        stdout = runRes.stdout;
        stderr = runRes.stderr;
        executionTimeMs = runRes.timeMs;
        if (runRes.code !== 0 || runRes.signal) {
          status = "FAILED";
        }
      }
    } else if (lang === "python" || lang === "py") {
      const sourceFile = path.join(runDir, "solution.py");
      await fs.writeFile(sourceFile, body.sourceCode);

      const pythonCmd = isWin ? "python" : "python3";
      const runRes = await runCommand(pythonCmd, [sourceFile], stdinValue, 5000);
      stdout = runRes.stdout;
      stderr = runRes.stderr;
      executionTimeMs = runRes.timeMs;
      if (runRes.code !== 0 || runRes.signal) {
        status = "FAILED";
      }
    } else if (lang === "java") {
      const sourceFile = path.join(runDir, "Main.java");
      await fs.writeFile(sourceFile, body.sourceCode);

      // Compile Java code
      const compileRes = await runCommand("javac", [sourceFile], "", 10000);
      if (compileRes.code !== 0) {
        status = "FAILED";
        stderr = `Compile Error:\n${compileRes.stderr}`;
        executionTimeMs = compileRes.timeMs;
      } else {
        // Run Java class
        const runRes = await runCommand("java", ["-cp", runDir, "Main"], stdinValue, 5000);
        stdout = runRes.stdout;
        stderr = runRes.stderr;
        executionTimeMs = runRes.timeMs;
        if (runRes.code !== 0 || runRes.signal) {
          status = "FAILED";
        }
      }
    } else {
      status = "FAILED";
      stderr = `Unsupported language: ${body.language}`;
    }
  } catch (err: any) {
    status = "FAILED";
    stderr = `Runtime error: ${err.message}`;
  } finally {
    try {
      await fs.rm(runDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }

  const record = await codeExecRepo.createCodeRun(app, {
    userId,
    language: body.language,
    sourceCode: body.sourceCode,
    stdin: body.stdin,
    stdout: stdout || undefined,
    stderr: stderr || undefined,
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
