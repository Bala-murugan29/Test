import { useState } from 'react';
import { useLocation } from 'wouter';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { examService } from '@/services/exam.service';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';

interface Step1Data {
  title: string;
  subject: string;
  department: string;
  durationMinutes: string;
  totalQuestions: string;
  totalMarks: string;
  passingMarks: string;
}

interface Step2Data {
  scheduledAt: string;
  endsAt: string;
  allowedAttempts: string;
  instructions: string[];
}

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology'];

const STEPS = ['Basic Info', 'Settings', 'Review & Publish'];

export default function CreateExamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [newInstruction, setNewInstruction] = useState('');

  const [step1, setStep1] = useState<Step1Data>({
    title: '',
    subject: '',
    department: DEPARTMENTS[0],
    durationMinutes: '60',
    totalQuestions: '30',
    totalMarks: '60',
    passingMarks: '24',
  });

  const [step2, setStep2] = useState<Step2Data>({
    scheduledAt: '',
    endsAt: '',
    allowedAttempts: '1',
    instructions: [
      'Read each question carefully before answering.',
      'Do not close the browser tab during the examination.',
    ],
  });

  const addInstruction = () => {
    if (!newInstruction.trim()) return;
    setStep2((s) => ({ ...s, instructions: [...s.instructions, newInstruction.trim()] }));
    setNewInstruction('');
  };

  const removeInstruction = (i: number) => {
    setStep2((s) => ({ ...s, instructions: s.instructions.filter((_, idx) => idx !== i) }));
  };

  const handlePublish = async (status: 'draft' | 'published') => {
    if (!user) return;
    setSaving(true);
    await examService.createExam({
      title: step1.title,
      subject: step1.subject,
      department: step1.department,
      facultyId: user.id,
      facultyName: user.name,
      durationMinutes: Number(step1.durationMinutes),
      totalQuestions: Number(step1.totalQuestions),
      totalMarks: Number(step1.totalMarks),
      passingMarks: Number(step1.passingMarks),
      scheduledAt: step2.scheduledAt || new Date().toISOString(),
      endsAt: step2.endsAt || new Date().toISOString(),
      allowedAttempts: Number(step2.allowedAttempts),
      instructions: step2.instructions,
      status,
    });
    setSaving(false);
    setLocation('/faculty/dashboard');
  };

  return (
    <DashboardLayout breadcrumbs={['Faculty', 'Exams', 'Create']}>
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Create Exam" subtitle="Set up a new examination for your students" />

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                  i < step ? 'bg-primary border-primary text-primary-foreground'
                    : i === step ? 'border-primary text-primary'
                    : 'border-card-border text-muted-foreground'
                )}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={cn('text-xs mt-1 font-medium whitespace-nowrap', i === step ? 'text-primary' : 'text-muted-foreground')}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-px mx-2 mt-[-14px]', i < step ? 'bg-primary' : 'bg-card-border')} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 0 && (
          <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Exam Title *</Label>
              <Input id="title" value={step1.title} onChange={(e) => setStep1((s) => ({ ...s, title: e.target.value }))} placeholder="e.g. Advanced Database Management" data-testid="input-exam-title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subject">Subject Code</Label>
                <Input id="subject" value={step1.subject} onChange={(e) => setStep1((s) => ({ ...s, subject: e.target.value }))} placeholder="e.g. DBMS" data-testid="input-subject" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  value={step1.department}
                  onChange={(e) => setStep1((s) => ({ ...s, department: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="select-department"
                >
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" type="number" min="10" max="360" value={step1.durationMinutes} onChange={(e) => setStep1((s) => ({ ...s, durationMinutes: e.target.value }))} data-testid="input-duration" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="totalQ">Total Questions</Label>
                <Input id="totalQ" type="number" min="1" value={step1.totalQuestions} onChange={(e) => setStep1((s) => ({ ...s, totalQuestions: e.target.value }))} data-testid="input-total-questions" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="totalM">Total Marks</Label>
                <Input id="totalM" type="number" min="1" value={step1.totalMarks} onChange={(e) => setStep1((s) => ({ ...s, totalMarks: e.target.value }))} data-testid="input-total-marks" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="passingM">Passing Marks</Label>
                <Input id="passingM" type="number" min="0" value={step1.passingMarks} onChange={(e) => setStep1((s) => ({ ...s, passingMarks: e.target.value }))} data-testid="input-passing-marks" />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <Button onClick={() => setStep(1)} disabled={!step1.title.trim()} data-testid="button-step-next">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scheduledAt">Scheduled Date &amp; Time</Label>
                <Input id="scheduledAt" type="datetime-local" value={step2.scheduledAt} onChange={(e) => setStep2((s) => ({ ...s, scheduledAt: e.target.value }))} data-testid="input-scheduled-at" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="endsAt">End Date &amp; Time</Label>
                <Input id="endsAt" type="datetime-local" value={step2.endsAt} onChange={(e) => setStep2((s) => ({ ...s, endsAt: e.target.value }))} data-testid="input-ends-at" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="attempts">Allowed Attempts</Label>
              <Input id="attempts" type="number" min="1" max="5" value={step2.allowedAttempts} onChange={(e) => setStep2((s) => ({ ...s, allowedAttempts: e.target.value }))} className="max-w-[120px]" data-testid="input-allowed-attempts" />
            </div>

            {/* Instructions */}
            <div className="flex flex-col gap-2">
              <Label>Instructions</Label>
              <div className="flex flex-col gap-2">
                {step2.instructions.map((inst, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-card-border">
                    <span className="text-xs text-muted-foreground mt-0.5 w-4 shrink-0">{i + 1}.</span>
                    <p className="text-sm text-foreground flex-1">{inst}</p>
                    <button onClick={() => removeInstruction(i)} className="text-muted-foreground hover:text-destructive" data-testid={`button-remove-instruction-${i}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <Textarea
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  placeholder="Add an instruction..."
                  className="text-sm resize-none"
                  rows={2}
                  data-testid="input-new-instruction"
                />
                <Button variant="outline" size="sm" onClick={addInstruction} className="self-end" data-testid="button-add-instruction">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between mt-2">
              <Button variant="outline" onClick={() => setStep(0)} data-testid="button-step-back">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(2)} data-testid="button-step-next-2">
                Review <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-foreground">Review Exam Details</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <ReviewField label="Title" value={step1.title} />
              <ReviewField label="Subject" value={step1.subject} />
              <ReviewField label="Department" value={step1.department} />
              <ReviewField label="Duration" value={`${step1.durationMinutes} minutes`} />
              <ReviewField label="Total Questions" value={step1.totalQuestions} />
              <ReviewField label="Total Marks" value={step1.totalMarks} />
              <ReviewField label="Passing Marks" value={step1.passingMarks} />
              <ReviewField label="Allowed Attempts" value={step2.allowedAttempts} />
              {step2.scheduledAt && <ReviewField label="Scheduled At" value={formatDateTime(step2.scheduledAt)} />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Instructions ({step2.instructions.length})</p>
              <ol className="list-decimal list-inside text-sm text-foreground space-y-1">
                {step2.instructions.map((inst, i) => <li key={i}>{inst}</li>)}
              </ol>
            </div>
            <div className="flex gap-3 justify-between mt-2">
              <Button variant="outline" onClick={() => setStep(1)} data-testid="button-step-back-2">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handlePublish('draft')} disabled={saving} data-testid="button-save-draft">
                  Save as Draft
                </Button>
                <Button onClick={() => handlePublish('published')} disabled={saving} data-testid="button-publish-exam">
                  {saving ? 'Publishing...' : 'Publish Exam'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground mt-0.5">{value || '-'}</p>
    </div>
  );
}
