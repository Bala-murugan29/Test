import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { BookOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SearchInput } from '@/components/common/SearchInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { examService } from '@/services/exam.service';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { StudentExam } from '@/types';
import { formatDateTime, formatDuration } from '@/utils/format';
import { Clock, FileText } from 'lucide-react';

export default function AvailableExamsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!user) return;
    examService.getStudentExams(user.id).then((e) => {
      setExams(e);
      setLoading(false);
    });
  }, [user]);

  const filterExams = (list: StudentExam[]) =>
    list.filter(
      (e) =>
        e.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        e.subject.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

  const upcoming = filterExams(exams.filter((e) => e.status === 'published'));
  const ongoing = filterExams(exams.filter((e) => e.status === 'ongoing'));
  const completed = filterExams(exams.filter((e) => e.status === 'completed'));
  const all = filterExams(exams);

  return (
    <DashboardLayout breadcrumbs={['Student', 'Exams']}>
      <PageHeader title="Available Exams" subtitle="Browse and manage your assigned examinations" />

      <div className="flex items-center gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search exams..." className="max-w-sm" />
      </div>

      {loading ? (
        <LoadingSpinner className="min-h-[300px]" message="Loading exams..." />
      ) : (
        <Tabs defaultValue="all" data-testid="tabs-exam-filter">
          <TabsList>
            <TabsTrigger value="all">All ({all.length})</TabsTrigger>
            <TabsTrigger value="ongoing">Live ({ongoing.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>
          {[
            { key: 'all', list: all },
            { key: 'ongoing', list: ongoing },
            { key: 'upcoming', list: upcoming },
            { key: 'completed', list: completed },
          ].map(({ key, list }) => (
            <TabsContent key={key} value={key} className="mt-4">
              {list.length === 0 ? (
                <EmptyState title="No exams found" description="Try adjusting your search." icon={<BookOpen className="w-7 h-7" />} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {list.map((exam) => (
                    <ExamCard key={exam.id} exam={exam} onView={() => setLocation(`/student/exams/${exam.id}/instructions`)} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </DashboardLayout>
  );
}

function ExamCard({ exam, onView }: { exam: StudentExam; onView: () => void }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex flex-col gap-4" data-testid={`exam-card-${exam.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm leading-snug">{exam.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{exam.department}</p>
        </div>
        <StatusBadge status={exam.status} />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatDuration(exam.durationMinutes)}</span>
        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />{exam.totalQuestions} questions</span>
      </div>

      <div className="text-xs text-muted-foreground">
        <span className="font-medium">Scheduled:</span> {formatDateTime(exam.scheduledAt)}
      </div>

      {exam.status === 'completed' && exam.lastScore !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Your score:</span>
          <span className={`font-semibold ${exam.isPassed ? 'text-emerald-600' : 'text-red-500'}`}>{exam.lastScore}%</span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${exam.isPassed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {exam.isPassed ? 'Passed' : 'Failed'}
          </span>
        </div>
      )}

      <Button
        size="sm"
        variant={exam.status === 'ongoing' ? 'default' : 'outline'}
        onClick={onView}
        className="w-full"
        data-testid={`button-view-exam-${exam.id}`}
      >
        {exam.status === 'ongoing' ? 'Enter Exam' : exam.status === 'completed' ? 'View Result' : 'View Details'}
      </Button>
    </div>
  );
}
