import { Question } from '@/types';
import { cn } from '@/utils/cn';

interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  flaggedQuestions: Set<string>;
  onNavigate: (index: number) => void;
}

type QState = 'current' | 'answered' | 'flagged' | 'unanswered';

function getQuestionState(
  question: Question,
  index: number,
  currentIndex: number,
  answers: Record<string, string>,
  flagged: Set<string>
): QState {
  if (index === currentIndex) return 'current';
  if (flagged.has(question.id)) return 'flagged';
  if (answers[question.id]) return 'answered';
  return 'unanswered';
}

const stateStyle: Record<QState, string> = {
  current: 'bg-primary text-primary-foreground border-primary',
  answered: 'bg-emerald-500 text-white border-emerald-500',
  flagged: 'bg-amber-400 text-amber-950 border-amber-400',
  unanswered: 'bg-card text-foreground border-card-border hover:border-primary/50',
};

export function QuestionNavigator({
  questions,
  currentIndex,
  answers,
  flaggedQuestions,
  onNavigate,
}: QuestionNavigatorProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="question-navigator">
      <h3 className="text-sm font-semibold text-foreground">Question Palette</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const state = getQuestionState(q, idx, currentIndex, answers, flaggedQuestions);
          return (
            <button
              key={q.id}
              onClick={() => onNavigate(idx)}
              data-testid={`nav-question-${idx + 1}`}
              title={`Question ${idx + 1}`}
              className={cn(
                'w-full aspect-square rounded-lg border text-xs font-semibold transition-all',
                stateStyle[state]
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-primary inline-block" />Current</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Answered</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />Flagged</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-card border border-card-border inline-block" />Not attempted</div>
      </div>
    </div>
  );
}
