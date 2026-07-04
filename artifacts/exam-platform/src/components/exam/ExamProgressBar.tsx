interface ExamProgressBarProps {
  answered: number;
  total: number;
}

export function ExamProgressBar({ answered, total }: ExamProgressBarProps) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        {answered}/{total}
      </span>
    </div>
  );
}
