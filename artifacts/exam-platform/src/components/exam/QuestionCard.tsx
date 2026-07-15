import { Flag } from 'lucide-react';
import { Question } from '@/types';
import { AnswerOption } from './AnswerOption';
import { CodeEditor } from './CodeEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { Language } from '@/types/coding.types';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId?: string;
  isFlagged: boolean;
  onAnswer: (optionId: string) => void;
  onToggleFlag: () => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  isFlagged,
  onAnswer,
  onToggleFlag,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-5" data-testid={`question-card-${question.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{question.marks} marks</span>
            {question.negativeMarks > 0 && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-red-500 dark:text-red-400">-{question.negativeMarks} negative</span>
              </>
            )}
          </div>
          <p className="text-base font-medium text-foreground leading-relaxed">{question.text}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFlag}
          data-testid="button-flag-question"
          className={cn(
            'flex-shrink-0 gap-1.5',
            isFlagged ? 'text-amber-500 dark:text-amber-400 hover:text-amber-600' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Flag className={cn('w-4 h-4', isFlagged && 'fill-current')} />
          {isFlagged ? 'Flagged' : 'Flag'}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {question.type === 'coding' ? (
          <div className="h-[400px] border border-card-border rounded-lg overflow-hidden">
            <CodeEditor
              language={(question.coding?.languageConstraints?.[0] as Language) || 'python'}
              value={selectedOptionId || question.coding?.starterCode || ''}
              onChange={onAnswer}
            />
          </div>
        ) : (
          question.options.map((option, idx) => (
            <AnswerOption
              key={option.id}
              option={option}
              selected={selectedOptionId === option.id}
              onSelect={onAnswer}
              optionIndex={idx}
            />
          ))
        )}
      </div>
    </div>
  );
}
