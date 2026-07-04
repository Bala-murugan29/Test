import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Plus, Pencil, Trash2, Library } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { examService } from '@/services/exam.service';
import { Exam, Question } from '@/types';
import { cn } from '@/utils/cn';

export default function QuestionBankPage() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({ text: '', marks: '2', negativeMarks: '0.5' });

  useEffect(() => {
    if (!examId) return;
    Promise.all([
      examService.getExamById(examId),
      examService.getExamQuestions(examId),
    ]).then(([e, q]) => {
      setExam(e);
      setQuestions(q);
      setLoading(false);
    });
  }, [examId]);

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setDeleteTarget(null);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.text.trim()) return;
    const q: Question = {
      id: `q_new_${Date.now()}`,
      examId: examId ?? '',
      text: newQuestion.text,
      type: 'mcq',
      options: [
        { id: `opt_a_${Date.now()}`, text: 'Option A' },
        { id: `opt_b_${Date.now()}`, text: 'Option B' },
        { id: `opt_c_${Date.now()}`, text: 'Option C' },
        { id: `opt_d_${Date.now()}`, text: 'Option D' },
      ],
      correctOptionId: `opt_a_${Date.now()}`,
      marks: Number(newQuestion.marks),
      negativeMarks: Number(newQuestion.negativeMarks),
    };
    setQuestions((prev) => [...prev, q]);
    setNewQuestion({ text: '', marks: '2', negativeMarks: '0.5' });
    setAddingNew(false);
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
          <Button onClick={() => setAddingNew(true)} disabled={addingNew} data-testid="button-add-question">
            <Plus className="w-4 h-4 mr-1.5" /> Add Question
          </Button>
        }
      />

      {addingNew && (
        <div className="bg-card border border-primary/50 rounded-xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">New Question</h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="q-text">Question Text *</Label>
              <Input
                id="q-text"
                value={newQuestion.text}
                onChange={(e) => setNewQuestion((s) => ({ ...s, text: e.target.value }))}
                placeholder="Enter the question..."
                data-testid="input-question-text"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="q-marks">Marks</Label>
                <Input id="q-marks" type="number" min="0.5" step="0.5" value={newQuestion.marks} onChange={(e) => setNewQuestion((s) => ({ ...s, marks: e.target.value }))} className="w-24" data-testid="input-question-marks" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="q-neg">Negative Marks</Label>
                <Input id="q-neg" type="number" min="0" step="0.25" value={newQuestion.negativeMarks} onChange={(e) => setNewQuestion((s) => ({ ...s, negativeMarks: e.target.value }))} className="w-24" data-testid="input-negative-marks" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddingNew(false)} data-testid="button-cancel-add">Cancel</Button>
              <Button onClick={handleAddQuestion} disabled={!newQuestion.text.trim()} data-testid="button-save-question">Add Question</Button>
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
                  <span>{q.options.length} options</span>
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
