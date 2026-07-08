import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Plus, Eye, Library, FileEdit, BookOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { examService } from '@/services/exam.service';
import { useAuth } from '@/hooks/useAuth';
import { Exam } from '@/types';
import { formatDateTime, formatDuration } from '@/utils/format';
import { cn } from '@/utils/cn';

const STATUS_ORDER: Record<string, number> = { ongoing: 0, published: 1, draft: 2, completed: 3, cancelled: 4 };

export default function FacultyExamListPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'published' | 'draft' | 'completed'>('all');

  const loadExams = () => {
    if (!user) { setLoading(false); return; }
    examService.getFacultyExams(user.id).then((e) => {
      setExams(e.sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)));
      setLoading(false);
    });
  };

  useEffect(() => {
    loadExams();
  }, [user]);

  const handlePublish = async (examId: string) => {
    try {
      await examService.publishExam(examId);
      loadExams();
    } catch (err) {
      console.error(err);
      alert("Failed to publish exam. Make sure the exam has at least one question.");
    }
  };

  const filtered = filter === 'all' ? exams : exams.filter((e) => e.status === filter);

  const counts = {
    all: exams.length,
    ongoing: exams.filter((e) => e.status === 'ongoing').length,
    published: exams.filter((e) => e.status === 'published').length,
    draft: exams.filter((e) => e.status === 'draft').length,
    completed: exams.filter((e) => e.status === 'completed').length,
  };

  return (
    <DashboardLayout breadcrumbs={['Faculty', 'Exams', 'All Exams']}>
      <PageHeader
        title="My Exams"
        subtitle="All coding exams you have created"
        actions={
          <Button onClick={() => setLocation('/faculty/exams/create')} data-testid="button-create-exam">
            <Plus className="w-4 h-4 mr-1.5" /> New Exam
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', 'ongoing', 'published', 'draft', 'completed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            data-testid={`filter-${s}`}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
              filter === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-muted-foreground border-card-border hover:border-primary/40'
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="min-h-[300px]" message="Loading exams..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No exams found"
          description={filter === 'all' ? 'Create your first coding exam to get started.' : `No ${filter} exams.`}
          icon={<BookOpen className="w-7 h-7" />}
          action={{ label: 'Create Exam', onClick: () => setLocation('/faculty/exams/create') }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onViewQuestions={() => setLocation(`/faculty/exams/${exam.id}/questions`)}
              onPublish={() => handlePublish(exam.id)}
              onEdit={() => setLocation(`/faculty/exams/${exam.id}/edit`)}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function ExamCard({
  exam,
  onViewQuestions,
  onPublish,
  onEdit,
}: {
  exam: Exam;
  onViewQuestions: () => void;
  onPublish: () => void;
  onEdit: () => void;
}) {
  const problemCount = exam.totalQuestions;

  return (
    <div
      className="bg-card border border-card-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
      data-testid={`exam-card-${exam.id}`}
    >
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <Library className="w-5 h-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{exam.title}</h3>
          <StatusBadge status={exam.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{exam.subject}</span>
          <span>·</span>
          <span>{exam.department}</span>
          <span>·</span>
          <span>{formatDuration(exam.durationMinutes)}</span>
          <span>·</span>
          <span>{problemCount} problem{problemCount !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{exam.totalMarks} marks</span>
        </div>
        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
          <span>Scheduled: {formatDateTime(exam.scheduledAt)}</span>
          {exam.status === 'completed' && <span>Ended: {formatDateTime(exam.endsAt)}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        {exam.status === 'draft' && (
          <Button
            variant="default"
            size="sm"
            onClick={onPublish}
            disabled={problemCount === 0}
            title={problemCount === 0 ? "Add at least one question before publishing" : "Publish exam"}
            data-testid={`button-publish-${exam.id}`}
            className="flex items-center gap-1.5"
          >
            Publish
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onViewQuestions}
          data-testid={`button-questions-${exam.id}`}
          className="flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" /> Problems
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          data-testid={`button-edit-${exam.id}`}
          className="flex items-center gap-1.5"
        >
          <FileEdit className="w-3.5 h-3.5" /> Edit
        </Button>
      </div>
    </div>
  );
}
