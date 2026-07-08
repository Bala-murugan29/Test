import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Plus, Pencil, Trash2, Library, Code, List } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { examService } from '@/services/exam.service';
import { questionService } from '@/services/question.service';
import { apiGet, apiPost, apiDelete } from '@/lib/axios';
import { Exam, Question } from '@/types';
import { cn } from '@/utils/cn';

export default function QuestionBankPage() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string>('');

  // Form states
  const [questionType, setQuestionType] = useState<'mcq' | 'coding'>('mcq');
  const [qTitle, setQTitle] = useState('');
  const [qText, setQText] = useState('');
  const [qMarks, setQMarks] = useState('2');
  const [qDifficulty, setQDifficulty] = useState('1'); // 1-5

  // MCQ options
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);

  // Coding test cases
  const [testCases, setTestCases] = useState<Array<{ input: string; expectedOutput: string; isHidden: boolean }>>([
    { input: '', expectedOutput: '', isHidden: false },
    { input: '', expectedOutput: '', isHidden: true },
  ]);

  const loadQuestions = () => {
    if (!examId) return;
    setLoading(true);
    Promise.all([
      examService.getExamById(examId),
      examService.getExamQuestions(examId),
      apiGet<any>('/departments', { params: { page: 1, limit: 1 } }).catch(() => null),
    ]).then(([e, q, depts]) => {
      setExam(e);
      setQuestions(q);
      if (depts && depts.data && depts.data.length > 0) {
        setDepartmentId(depts.data[0].id);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadQuestions();
  }, [examId]);

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/exams/${examId}/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error(err);
    }
    setDeleteTarget(null);
  };

  const handleAddQuestion = async () => {
    if (!qText.trim() || !qTitle.trim() || !examId) return;

    let targetDeptId = departmentId;
    if (!targetDeptId) {
      try {
        const depts = await apiGet<any>('/departments', { params: { page: 1, limit: 1 } });
        if (depts.data && depts.data.length > 0) {
          targetDeptId = depts.data[0].id;
          setDepartmentId(targetDeptId);
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (!targetDeptId) return;

    try {
      let createdQuestionId = '';
      if (questionType === 'mcq') {
        const formattedOptions = options.map(o => ({ text: o || 'Option' }));
        const res = await questionService.createMcq({
          departmentId: targetDeptId,
          title: qTitle,
          prompt: qText,
          difficulty: Number(qDifficulty),
          marks: Number(qMarks),
          options: formattedOptions,
          correctOptionIndex: correctOptionIdx,
        });
        createdQuestionId = res.id;
      } else {
        const publicSample = testCases.find(tc => !tc.isHidden);
        const res = await questionService.createCoding({
          departmentId: targetDeptId,
          title: qTitle,
          prompt: qText,
          difficulty: Number(qDifficulty),
          marks: Number(qMarks),
          testCases: testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden })),
          sampleInput: publicSample?.input ?? '',
          sampleOutput: publicSample?.expectedOutput ?? '',
        });
        createdQuestionId = res.id;
      }

      // Link to exam
      await apiPost(`/exams/${examId}/questions`, {
        questionId: createdQuestionId,
        sequenceNo: questions.length + 1,
        marksOverride: Number(qMarks),
        negativeMarks: 0,
        isMandatory: true,
      });

      // Refresh questions list
      loadQuestions();

      // Reset form states
      setQText('');
      setQTitle('');
      setQMarks('2');
      setQDifficulty('1');
      setOptions(['', '', '', '']);
      setCorrectOptionIdx(0);
      setTestCases([
        { input: '', expectedOutput: '', isHidden: false },
        { input: '', expectedOutput: '', isHidden: true },
      ]);
      setAddingNew(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishExam = async () => {
    if (!examId) return;
    try {
      const updated = await examService.publishExam(examId);
      setExam(updated);
    } catch (err) {
      console.error("Failed to publish exam:", err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={['Faculty', 'Question Bank']}>
        <LoadingSpinner className="min-h-[400px]" message="Loading questions..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={['Faculty', 'Exams', exam?.title ?? '', 'Questions']}>
      <PageHeader
        title="Question Bank"
        subtitle={exam ? `${exam.title} · ${questions.length} questions` : ''}
        actions={
          <div className="flex gap-2">
            {exam && exam.status === 'draft' && questions.length > 0 && (
              <Button onClick={handlePublishExam} variant="outline" className="border-primary text-primary hover:bg-primary/10" data-testid="button-publish-exam">
                Publish Exam
              </Button>
            )}
            <Button onClick={() => setAddingNew(true)} disabled={addingNew} data-testid="button-add-question">
              <Plus className="w-4 h-4 mr-1.5" /> Add Question
            </Button>
          </div>
        }
      />

      {addingNew && (
        <div className="bg-card border border-primary/50 rounded-xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">New Question</h3>

          {/* Question Type Selector */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={questionType === 'mcq' ? 'default' : 'outline'}
              onClick={() => setQuestionType('mcq')}
              size="sm"
            >
              <List className="w-4.5 h-4.5 mr-1.5" /> Multiple Choice (MCQ)
            </Button>
            <Button
              type="button"
              variant={questionType === 'coding' ? 'default' : 'outline'}
              onClick={() => setQuestionType('coding')}
              size="sm"
            >
              <Code className="w-4.5 h-4.5 mr-1.5" /> Coding Question
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="q-title">Question Title *</Label>
              <Input
                id="q-title"
                value={qTitle}
                onChange={(e) => setQTitle(e.target.value)}
                placeholder="e.g. Two Sum"
                data-testid="input-question-title"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="q-text">Question Prompt / Description *</Label>
              <textarea
                id="q-text"
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Enter the question description..."
                data-testid="input-question-text"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="q-marks">Marks</Label>
                <Input id="q-marks" type="number" min="1" value={qMarks} onChange={(e) => setQMarks(e.target.value)} className="w-24" data-testid="input-question-marks" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="q-diff">Difficulty</Label>
                <select
                  id="q-diff"
                  value={qDifficulty}
                  onChange={(e) => setQDifficulty(e.target.value)}
                  className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="1">1 (Easy)</option>
                  <option value="2">2 (Easy-Medium)</option>
                  <option value="3">3 (Medium)</option>
                  <option value="4">4 (Medium-Hard)</option>
                  <option value="5">5 (Hard)</option>
                </select>
              </div>
            </div>

            {/* MCQ Options */}
            {questionType === 'mcq' && (
              <div className="flex flex-col gap-3 border-t border-card-border pt-4 mt-2">
                <Label className="font-semibold mb-1">Options &amp; Correct Answer Selection</Label>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIdx === i}
                      onChange={() => setCorrectOptionIdx(i)}
                      className="h-4 w-4 shrink-0"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const copy = [...options];
                        copy[i] = e.target.value;
                        setOptions(copy);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      required
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Coding Test Cases */}
            {questionType === 'coding' && (
              <div className="flex flex-col gap-4 border-t border-card-border pt-4 mt-2">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Public / Sample Test Cases</h4>
                  <div className="flex flex-col gap-3">
                    {testCases.filter(tc => !tc.isHidden).map((tc, idx) => {
                      const realIndex = testCases.findIndex(x => x === tc);
                      return (
                        <div key={idx} className="border border-card-border p-3 rounded-lg flex flex-col gap-2 relative">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-muted-foreground">Sample {idx + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                setTestCases(prev => prev.filter((_, i) => i !== realIndex));
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Sample Input</Label>
                              <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs font-mono"
                                value={tc.input}
                                onChange={(e) => {
                                  setTestCases(prev => prev.map((item, i) => i === realIndex ? { ...item, input: e.target.value } : item));
                                }}
                                placeholder="Input passed to stdin"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Expected Output</Label>
                              <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs font-mono"
                                value={tc.expectedOutput}
                                onChange={(e) => {
                                  setTestCases(prev => prev.map((item, i) => i === realIndex ? { ...item, expectedOutput: e.target.value } : item));
                                }}
                                placeholder="Expected stdout"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Dotted Box Add Sample */}
                    <button
                      type="button"
                      onClick={() => setTestCases(prev => [...prev, { input: '', expectedOutput: '', isHidden: false }])}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-card-border hover:border-primary/50 hover:bg-muted/30 rounded-xl p-4 cursor-pointer text-sm text-muted-foreground transition-all gap-1 w-full"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add sample input and output</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Private / Hidden Test Cases</h4>
                  <div className="flex flex-col gap-3">
                    {testCases.filter(tc => tc.isHidden).map((tc, idx) => {
                      const realIndex = testCases.findIndex(x => x === tc);
                      return (
                        <div key={idx} className="border border-card-border p-3 rounded-lg flex flex-col gap-2 relative">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-muted-foreground">Hidden Test {idx + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                setTestCases(prev => prev.filter((_, i) => i !== realIndex));
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Private Input</Label>
                              <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs font-mono"
                                value={tc.input}
                                onChange={(e) => {
                                  setTestCases(prev => prev.map((item, i) => i === realIndex ? { ...item, input: e.target.value } : item));
                                }}
                                placeholder="Private input"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Expected Output</Label>
                              <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs font-mono"
                                value={tc.expectedOutput}
                                onChange={(e) => {
                                  setTestCases(prev => prev.map((item, i) => i === realIndex ? { ...item, expectedOutput: e.target.value } : item));
                                }}
                                placeholder="Expected stdout"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Dotted Box Add Hidden */}
                    <button
                      type="button"
                      onClick={() => setTestCases(prev => [...prev, { input: '', expectedOutput: '', isHidden: true }])}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-card-border hover:border-primary/50 hover:bg-muted/30 rounded-xl p-4 cursor-pointer text-sm text-muted-foreground transition-all gap-1 w-full"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add hidden input and output</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setAddingNew(false)} data-testid="button-cancel-add">Cancel</Button>
              <Button onClick={handleAddQuestion} disabled={!qText.trim() || !qTitle.trim()} data-testid="button-save-question">Add Question</Button>
            </div>
          </div>
        </div>
      )}

      {questions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Add questions to this exam using the button above."
          icon={<Library className="w-7 h-7" />}
          action={{ label: 'Add First Question', onClick: () => setAddingNew(true) }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((q, idx) => (
            <div key={q.id} className={cn('bg-card border border-card-border rounded-xl p-4 flex items-start gap-4')} data-testid={`question-row-${q.id}`}>
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{q.text}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="capitalize">{q.type.replace('_', ' ')}</span>
                  {q.type !== 'coding' && <span>{q.options.length} options</span>}
                  <span className="text-primary font-medium">+{q.marks} marks</span>
                  {q.negativeMarks > 0 && <span className="text-red-500">-{q.negativeMarks} negative</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-edit-question-${q.id}`}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(q.id)} data-testid={`button-delete-question-${q.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Question?"
        description="This question will be permanently removed from the exam."
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </DashboardLayout>
  );
}
