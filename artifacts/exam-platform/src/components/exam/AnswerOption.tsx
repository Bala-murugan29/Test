import { cn } from '@/utils/cn';
import { ExamOption } from '@/types';

interface AnswerOptionProps {
  option: ExamOption;
  selected: boolean;
  onSelect: (optionId: string) => void;
  optionIndex: number;
  disabled?: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function AnswerOption({ option, selected, onSelect, optionIndex, disabled }: AnswerOptionProps) {
  return (
    <button
      onClick={() => !disabled && onSelect(option.id)}
      disabled={disabled}
      data-testid={`option-${option.id}`}
      className={cn(
        'w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-150',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-card-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-sm font-semibold',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'
        )}
      >
        {OPTION_LETTERS[optionIndex] ?? optionIndex + 1}
      </span>
      <span className="flex-1 text-sm leading-relaxed pt-0.5">{option.text}</span>
    </button>
  );
}
