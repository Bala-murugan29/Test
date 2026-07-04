import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ExamPerformance } from '@/types';

interface ScoreBarChartProps {
  data: ExamPerformance[];
}

export function ScoreBarChart({ data }: ScoreBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="examTitle"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          angle={-25}
          textAnchor="end"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          unit="%"
        />
        <Tooltip
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }}
          formatter={(value: number, name: string) => [`${value}%`, name === 'avgScore' ? 'Avg Score' : 'Pass Rate']}
          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
        />
        <Bar dataKey="avgScore" name="avgScore" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.avgScore >= 70 ? 'hsl(233 57% 50%)' : entry.avgScore >= 50 ? 'hsl(43 90% 55%)' : 'hsl(0 72% 51%)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
