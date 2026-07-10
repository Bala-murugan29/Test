import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import {
  Play, Send, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle,
  Loader2, Terminal, BookOpen, ChevronDown, AlertTriangle,
} from 'lucide-react';
import { CodeEditor } from '@/components/exam/CodeEditor';
import { Button } from '@/components/ui/button';
import { examService } from '@/services/exam.service';
import { apiPost, apiPut } from '@/lib/axios';
import { useExamSessionStore } from '@/store/exam-session.store';
import type {
  Language, CodingProblem, TestRunResult, CodeSubmission,
  StarterCode,
} from '@/types/coding.types';
import { LANGUAGE_LABELS } from '@/types/coding.types';
import type { Exam } from '@/types';
import { cn } from '@/utils/cn';
import { useAntiCheat } from '@/hooks/useAntiCheat';

type PanelTab = 'problem' | 'testcases' | 'output';
type RunState = 'idle' | 'running' | 'done';

const LANGUAGES: Language[] = ['c', 'cpp', 'python', 'java'];

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'text-emerald-500',
  medium: 'text-amber-500',
  hard: 'text-red-500',
};

function simulateRun(problem: CodingProblem, language: Language, code: string): Promise<TestRunResult[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const results: TestRunResult[] = problem.examples.map((tc) => ({
        testCaseId: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: code.length > 100 ? tc.expectedOutput : 'Wrong Answer',
        passed: code.length > 100,
        runtime: `${Math.floor(Math.random() * 50 + 10)} ms`,
      }));
      resolve(results);
    }, 1200);
  });
}

function simulateSubmit(problem: CodingProblem, language: Language, code: string): Promise<CodeSubmission> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allTests = [...problem.examples, ...problem.hiddenTests];
      const passed = code.length > 100 ? allTests.length : Math.floor(allTests.length * 0.4);
      resolve({
        problemId: problem.id,
        language,
        code,
        passedTests: passed,
        totalTests: allTests.length,
        score: code.length > 100 ? problem.marks : Math.floor(problem.marks * 0.4),
        verdict: code.length > 100 ? 'accepted' : 'wrong_answer',
      });
    }, 1800);
  });
}

export default function CodingExamScreen() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();

  const [exam, setExam] = useState<Exam | null>(null);
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [language, setLanguage] = useState<Language>('cpp');
  const [codes, setCodes] = useState<Record<string, Record<Language, string>>>({});
  const [leftTab, setLeftTab] = useState<'problem' | 'testcases' | 'custom-input'>('problem');
  const [customInput, setCustomInput] = useState('');
  const [runState, setRunState] = useState<RunState>('idle');
  const [runResults, setRunResults] = useState<TestRunResult[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, CodeSubmission>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishingExam, setFinishingExam] = useState(false);
  const [descCollapsed, setDescCollapsed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Local session ID — created (or resumed) when the exam screen mounts.
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    useExamSessionStore.getState().sessionId
  );
  // Also watch the store so any external update is reflected.
  const storedSessionId = useExamSessionStore((s) => s.sessionId);
  const effectiveSessionId = activeSessionId ?? storedSessionId;

  useEffect(() => {
    if (!examId) return;
    examService.getExamById(examId).then(async (e) => {
      setExam(e);
      setTimeLeft((e?.durationMinutes ?? 60) * 60);

      // Try to load real questions from backend
      let loadedProblems: CodingProblem[] = [];
      try {
        const questions = await examService.getExamQuestions(examId);
        loadedProblems = questions
          .filter((q) => q.type === 'coding')
          .map((q, idx) => {
            const starter: StarterCode = {
              c: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
              cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
              python: '# Write your solution here\n',
              java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}',
            };

            const testCases = q.coding?.testCases ?? [];
            const sampleTests = testCases.filter((_t, i) => i < 2); // first 2 are sample
            const hiddenTests = testCases.filter((_t, i) => i >= 2); // rest are hidden

            return {
              id: q.id,
              examId,
              order: idx + 1,
              title: q.text || `Problem ${idx + 1}`,
              difficulty: q.marks >= 20 ? 'hard' : q.marks >= 10 ? 'medium' : 'easy' as 'easy' | 'medium' | 'hard',
              marks: q.marks,
              timeLimit: '2s',
              memoryLimit: '256 MB',
              description: q.text,
              inputFormat: q.coding?.sampleInput ?? 'See examples.',
              outputFormat: q.coding?.sampleOutput ?? 'See examples.',
              constraints: [],
              examples: sampleTests.map((tc, i) => ({
                id: `${q.id}_sample_${i}`,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
              })),
              hiddenTests: hiddenTests.map((tc, i) => ({
                id: `${q.id}_hidden_${i}`,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: true,
              })),
              starterCode: starter,
            } as CodingProblem;
          });
      } catch {
        // If loading fails, fall through to fallback
      }

      // Fall back to hardcoded problems if no real coding questions found
      if (loadedProblems.length === 0) {
        loadedProblems = getFallbackProblems(examId);
      }

      setProblems(loadedProblems);
      const initCodes: Record<string, Record<Language, string>> = {};
      loadedProblems.forEach((p) => {
        initCodes[p.id] = { ...p.starterCode } as Record<Language, string>;
      });
      setCodes(initCodes);

      // Create or resume the backend exam session now (before submit) so
      // autosave and submission use the same session ID.
      try {
        const session = await apiPost<{ id: string }>('/sessions', { examId });
        setActiveSessionId(session.id);
        useExamSessionStore.getState().setSessionId(session.id);
      } catch {
        // Session may already exist (attempt limit reached or already submitted).
        // The submit flow will handle this gracefully.
      }

      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [examId]);

  useEffect(() => {
    if (!exam || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setConfirmFinish(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [exam]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useAntiCheat({
    onAutoSubmit: () => {
      handleConfirmFinish();
    },
    maxViolations: 3,
  });

  const problem = problems[currentIdx];
  const currentCode = problem ? (codes[problem.id]?.[language] ?? problem.starterCode[language]) : '';

  const setCode = useCallback((val: string) => {
    if (!problem) return;
    setCodes((prev) => ({
      ...prev,
      [problem.id]: { ...(prev[problem.id] ?? problem.starterCode), [language]: val },
    }));
  }, [problem, language]);

  const handleRun = async () => {
    if (!problem) return;
    setRunState('running');

    if (leftTab === 'custom-input') {
      try {
        const response = await apiPost<{
          stdout: string | null;
          stderr: string | null;
          status: string;
          executionTimeMs: number | null;
        }>('/code/run', {
          language,
          sourceCode: currentCode,
          stdin: customInput,
        });

        setRunResults([
          {
            testCaseId: 'custom',
            input: customInput,
            expectedOutput: '',
            actualOutput: response.stdout ?? '',
            passed: response.status === 'COMPLETED',
            runtime: response.executionTimeMs ? `${response.executionTimeMs} ms` : undefined,
            stderr: response.stderr ?? undefined,
          },
        ]);
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Execution error';
        setRunResults([
          {
            testCaseId: 'custom',
            input: customInput,
            expectedOutput: '',
            actualOutput: '',
            passed: false,
            stderr: errorMsg,
          },
        ]);
      }
      setRunState('done');
      return;
    }
    
    const results: TestRunResult[] = [];
    for (const tc of problem.examples) {
      try {
        const response = await apiPost<{
          stdout: string | null;
          stderr: string | null;
          status: string;
          executionTimeMs: number | null;
        }>('/code/run', {
          language,
          sourceCode: currentCode,
          stdin: tc.input,
        });

        const actual = (response.stdout ?? '').trim();
        const expected = (tc.expectedOutput ?? '').trim();
        const passed = response.status === 'COMPLETED' && actual === expected;

        results.push({
          testCaseId: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: response.stdout ?? '',
          passed,
          runtime: response.executionTimeMs ? `${response.executionTimeMs} ms` : undefined,
          stderr: response.stderr ?? undefined,
          isHidden: false,
        });
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Execution error';
        results.push({
          testCaseId: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: '',
          passed: false,
          stderr: errorMsg,
          isHidden: false,
        });
      }
    }

    setRunResults(results);
    setRunState('done');
  };

  const handleSubmitProblem = async () => {
    if (!problem) return;
    setSubmitting(true);
    
    const allTests = [...problem.examples, ...problem.hiddenTests];
    let passedTestsCount = 0;
    const results: TestRunResult[] = [];

    for (const tc of allTests) {
      try {
        const response = await apiPost<{
          stdout: string | null;
          stderr: string | null;
          status: string;
          executionTimeMs: number | null;
        }>('/code/run', {
          language,
          sourceCode: currentCode,
          stdin: tc.input,
        });

        const actual = (response.stdout ?? '').trim();
        const expected = (tc.expectedOutput ?? '').trim();
        const passed = response.status === 'COMPLETED' && actual === expected;

        if (passed) {
          passedTestsCount++;
        }

        results.push({
          testCaseId: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: response.stdout ?? '',
          passed,
          runtime: response.executionTimeMs ? `${response.executionTimeMs} ms` : undefined,
          stderr: response.stderr ?? undefined,
          isHidden: tc.isHidden,
        });
      } catch (err: any) {
        results.push({
          testCaseId: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: '',
          passed: false,
          stderr: err.response?.data?.message || err.message || 'Execution error',
          isHidden: tc.isHidden,
        });
      }
    }

    const hasAnyError = results.some(r => r.stderr);
    const score = passedTestsCount === allTests.length ? problem.marks : Math.floor(problem.marks * (passedTestsCount / allTests.length));
    const verdict = passedTestsCount === allTests.length ? 'accepted' : (hasAnyError ? 'compilation_error' : 'wrong_answer');

    const sub: CodeSubmission = {
      problemId: problem.id,
      language,
      code: currentCode,
      passedTests: passedTestsCount,
      totalTests: allTests.length,
      score,
      verdict,
    };

    setSubmissions((prev) => ({ ...prev, [problem.id]: sub }));
    setSubmitting(false);
    setConfirmSubmit(false);
    
    // Show only public example results in the output tab
    setRunResults(results.filter(r => !r.isHidden));
    setRunState('done');
  };

  const handleFinishExam = () => setConfirmFinish(true);

  const handleConfirmFinish = async () => {
    if (!examId) return;
    setFinishingExam(true);
    try {
      // Use the session that was created when the exam screen mounted.
      // If for some reason it's missing, try creating one.
      let sessionId = effectiveSessionId ?? '';
      if (!sessionId) {
        try {
          const session = await apiPost<{ id: string }>('/sessions', { examId });
          sessionId = session.id;
          setActiveSessionId(session.id);
        } catch (createErr: any) {
          const msg =
            createErr?.response?.data?.message ||
            createErr?.response?.data?.error ||
            createErr?.message ||
            'Could not start or find exam session.';
          throw new Error(msg);
        }
      }

      // 2. Save all code answers via autosave
      const answerEntries = problems.map((p) => ({
        questionId: p.id,
        codeAnswer: codes[p.id]?.[language] ?? p.starterCode[language],
      }));

      try {
        await apiPut(`/sessions/${sessionId}/answers`, { answers: answerEntries });
      } catch (e) {
        console.warn('Autosave failed, trying individual saves:', e);
        // Fallback: save each answer individually
        for (const entry of answerEntries) {
          try {
            await apiPut(`/sessions/${sessionId}/answers/${entry.questionId}`, {
              codeAnswer: entry.codeAnswer,
            });
          } catch {
            // ignore individual failures
          }
        }
      }

      // 3. Submit the session
      await apiPost(`/sessions/${sessionId}/submit`);

      // 4. Navigate to result page
      setLocation(`/student/exams/${examId}/result`);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      alert(`Failed to submit exam: ${err instanceof Error ? err.message : 'Please try again.'}`);
      setFinishingExam(false);
      setConfirmFinish(false);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const submittedCount = Object.keys(submissions).length;

  if (loading || !problem || !exam) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  const isUrgent = timeLeft <= 300;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" data-testid="coding-exam-screen">
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="h-12 border-b border-card-border flex items-center px-4 gap-4 shrink-0 bg-card z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:block">{exam.title}</span>
        </div>

        {/* Problem tabs */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1 px-2">
          {problems.map((p, i) => {
            const sub = submissions[p.id];
            return (
              <button
                key={p.id}
                onClick={() => { setCurrentIdx(i); setRunResults([]); setRunState('idle'); }}
                data-testid={`problem-tab-${i}`}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0',
                  i === currentIdx ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {sub ? (
                  sub.verdict === 'accepted'
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    : <XCircle className="w-3 h-3 text-red-400" />
                ) : (
                  <span className="w-3 h-3 rounded-full border border-current opacity-50" />
                )}
                P{i + 1}
              </button>
            );
          })}
        </div>

        {/* Timer */}
        <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-mono font-semibold shrink-0', isUrgent ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-muted text-foreground')}>
          <Clock className="w-3.5 h-3.5" />
          {formatTime(timeLeft)}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleFinishExam}
          className="shrink-0 text-xs"
          data-testid="button-finish-exam"
        >
          Finish Exam
        </Button>
      </header>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Problem panel */}
        <div className="w-[42%] min-w-[300px] border-r border-card-border flex flex-col overflow-hidden bg-card">
          {/* Problem header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b border-card-border cursor-pointer"
            onClick={() => setDescCollapsed((v) => !v)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">P{currentIdx + 1}</span>
              <span className="text-sm font-semibold text-foreground truncate">{problem.title}</span>
              <span className={cn('text-xs font-semibold capitalize', DIFFICULTY_COLOR[problem.difficulty])}>{problem.difficulty}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{problem.marks} pts</span>
              <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', descCollapsed && 'rotate-180')} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-card-border px-4 gap-1 shrink-0">
            {(['problem', 'testcases', 'custom-input'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={cn(
                  'text-xs font-medium py-2 px-1 border-b-2 -mb-px transition-colors capitalize whitespace-nowrap',
                  leftTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
                data-testid={`left-tab-${t}`}
              >
                {t === 'testcases' ? 'Test Cases' : t === 'custom-input' ? 'Custom Input' : 'Problem'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed">
            {leftTab === 'problem' && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ProblemDescription problem={problem} />
              </div>
            )}
            {leftTab === 'testcases' && (
              <div className="flex flex-col gap-4">
                {problem.examples.map((tc, i) => (
                  <div key={tc.id} className="border border-card-border rounded-lg overflow-hidden">
                    <div className="px-3 py-1.5 bg-muted/40 text-xs font-medium text-muted-foreground border-b border-card-border">
                      Example {i + 1}
                    </div>
                    <div className="p-3 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Input</p>
                        <pre className="bg-muted rounded p-2 text-xs font-mono whitespace-pre-wrap">{tc.input}</pre>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Expected Output</p>
                        <pre className="bg-muted rounded p-2 text-xs font-mono whitespace-pre-wrap">{tc.expectedOutput}</pre>
                      </div>
                      {tc.explanation && (
                        <p className="text-xs text-muted-foreground italic">{tc.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="border border-card-border rounded-lg p-3 text-xs text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  {problem.hiddenTests.length} hidden test case{problem.hiddenTests.length !== 1 ? 's' : ''} are evaluated on submission.
                </div>
              </div>
            )}
            {leftTab === 'custom-input' && (
              <div className="flex flex-col gap-3 h-full">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Standard Input (stdin)</h4>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Enter the standard input values for your code execution.
                    For multiple variables, separate them with spaces (e.g. <code className="bg-muted px-1 py-0.5 rounded">5 10</code>) or newlines.
                  </p>
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter test input here..."
                  className="flex-1 w-full min-h-[180px] p-3 rounded-lg border border-input bg-card text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  data-testid="textarea-custom-input"
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Editor + output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-card-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as Language);
                  setRunResults([]);
                  setRunState('idle');
                }}
                className="h-7 px-2 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                data-testid="select-language"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRun}
                disabled={runState === 'running'}
                className="h-7 text-xs gap-1.5"
                data-testid="button-run-code"
              >
                {runState === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Run
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmSubmit(true)}
                disabled={submitting}
                className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="button-submit-problem"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Submit
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              language={language}
              value={currentCode}
              onChange={setCode}
              height="100%"
            />
          </div>

          {/* Output panel */}
          <div className="h-48 border-t border-card-border flex flex-col bg-card shrink-0">
            <div className="flex items-center gap-1 px-3 border-b border-card-border shrink-0">
              <div className="text-xs font-medium py-2 px-1 border-b-2 border-primary text-primary flex items-center gap-1 select-none">
                <Terminal className="w-3 h-3" /> Output
              </div>
              {runState !== 'idle' && (
                <span className={cn(
                  'ml-auto text-xs px-2 py-0.5 rounded-full font-medium',
                  runState === 'running'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {runState === 'running'
                    ? 'Running...'
                    : runResults[0]?.testCaseId === 'custom'
                      ? 'Custom execution completed'
                      : `${runResults.filter(r => r.passed).length}/${runResults.length} passed`}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {runState === 'idle' && (
                <p className="text-xs text-muted-foreground p-2">Run your code to see output.</p>
              )}
              {runState === 'running' && (
                <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing against test cases...
                </div>
              )}
              {runState === 'done' && runResults.map((r) => {
                const isCustom = r.testCaseId === 'custom';
                const success = r.passed || (isCustom && !r.stderr);
                
                return (
                  <div
                    key={r.testCaseId}
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs border',
                      success
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      {success
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      <span className={success ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {isCustom
                          ? (r.stderr ? 'Execution Error' : 'Execution Successful')
                          : (r.passed ? 'Accepted' : r.stderr ? 'Compile / Runtime Error' : 'Wrong Answer')}
                      </span>
                      {r.runtime && <span className="ml-auto text-muted-foreground font-normal">{r.runtime}</span>}
                    </div>
                    {r.stderr ? (
                      <div className="mt-1 bg-red-950/5 p-2 rounded border border-red-200/50">
                        <p className="text-red-500 font-bold text-xs uppercase mb-1">Diagnostics:</p>
                        <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono text-[11px] leading-tight select-all">{r.stderr}</pre>
                      </div>
                    ) : isCustom ? (
                      <div className="font-mono mt-1.5 bg-muted/40 p-2 rounded border border-card-border">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Standard Output:</p>
                        <pre className="text-foreground whitespace-pre-wrap font-mono text-xs max-h-36 overflow-y-auto select-all">{r.actualOutput || '(No output)'}</pre>
                      </div>
                    ) : (
                      <div className="font-mono space-y-1">
                        {r.isHidden ? (
                          <p className="text-muted-foreground">Result: <span className="text-foreground">{r.passed ? 'Passed' : 'Failed'}</span></p>
                        ) : (
                          <>
                            <p className="text-muted-foreground">Expected: <span className="text-foreground">{r.expectedOutput}</span></p>
                            <p className="text-muted-foreground">Got: <span className="text-foreground">{r.actualOutput}</span></p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Problem nav footer */}
      <div className="h-10 border-t border-card-border flex items-center justify-between px-4 bg-card shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="h-7 text-xs"
          data-testid="button-prev-problem"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          {submittedCount}/{problems.length} submitted
        </span>
        {currentIdx < problems.length - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIdx((i) => Math.min(problems.length - 1, i + 1))}
            className="h-7 text-xs"
            data-testid="button-next-problem"
          >
            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleFinishExam}
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="button-finish-exam-bottom"
          >
            Finish Exam
          </Button>
        )}
      </div>

      {/* Submit confirm overlay */}
      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Submit Solution?</h3>
                <p className="text-xs text-muted-foreground">Problem {currentIdx + 1}: {problem.title}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Your code will be run against all test cases. You can still change your answer until you finish the exam.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmSubmit(false)} data-testid="button-cancel-submit">Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmitProblem} disabled={submitting} data-testid="button-confirm-submit">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Judging...</> : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Finish exam confirm overlay */}
      {confirmFinish && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Finish Exam?</h3>
                <p className="text-xs text-muted-foreground">{submittedCount}/{problems.length} problems submitted</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Your code will be saved and the exam will be submitted. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmFinish(false)} disabled={finishingExam} data-testid="button-cancel-finish">Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmFinish} disabled={finishingExam} data-testid="button-confirm-finish">
                {finishingExam ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Finish & Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProblemDescription({ problem }: { problem: CodingProblem }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="text-foreground leading-relaxed whitespace-pre-line">{problem.description}</div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Input Format</h4>
        <p className="text-foreground whitespace-pre-line">{problem.inputFormat}</p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Output Format</h4>
        <p className="text-foreground whitespace-pre-line">{problem.outputFormat}</p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Constraints</h4>
        <ul className="space-y-1">
          {problem.constraints.map((c, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <code className="text-xs font-mono">{c}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-card-border text-xs text-muted-foreground">
        <span>⏱ {problem.timeLimit}</span>
        <span>💾 {problem.memoryLimit}</span>
        <span className="ml-auto font-semibold text-foreground">{problem.marks} marks</span>
      </div>
    </div>
  );
}

function getFallbackProblems(examId: string): CodingProblem[] {
  const starter: StarterCode = {
    c: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
    python: '# Write your solution here\n',
    java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}',
  };
  return [
    {
      id: `fp_${examId}_1`,
      examId,
      order: 1,
      title: 'Hello World',
      difficulty: 'easy',
      marks: 10,
      timeLimit: '1s',
      memoryLimit: '64 MB',
      description: 'Print "Hello, World!" to the standard output.',
      inputFormat: 'No input.',
      outputFormat: 'Print exactly: Hello, World!',
      constraints: [],
      examples: [{ id: 'ex1', input: '', expectedOutput: 'Hello, World!' }],
      hiddenTests: [],
      starterCode: starter,
    },
  ];
}
